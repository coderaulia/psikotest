import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { scoreIQ, scoreDISC, scoreWorkload, createScoringResult, type ScoredQuestion, type SubmissionAnswer } from '../lib/scoring';
import { rateLimitByIp, rateLimit, getIpFromContext } from '../middleware/rate-limit';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateToken(length = 24): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface SessionRow {
  id: number;
  title: string;
  description: string | null;
  test_type: string;
  status: string;
  access_token: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  settings_json: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

const startSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  positionTitle: z.string().optional(),
});

const answersSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number().int(),
    selectedOptionId: z.number().int().optional(),
    mostOptionId: z.number().int().optional(),
    leastOptionId: z.number().int().optional(),
    likertValue: z.number().int().min(1).max(7).optional(),
    answer: z.union([z.string(), z.number(), z.null()]).optional(),
  })),
  groupIndex: z.number().int().optional(),
});

// ─── GET /api/public/session/:token ─────────────────────────────────────────

app.get('/session/:token', async (c) => {
  const token = c.req.param('token');

  const session = await queryOne<SessionRow>(
    c.env.DB,
    `SELECT id, title, description, test_type, status, access_token,
            instructions, time_limit_minutes, settings_json, starts_at, ends_at
     FROM test_sessions
     WHERE access_token = ?
     LIMIT 1`,
    [token],
  );

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (session.status !== 'active') {
    return c.json({ error: 'This session is not currently active', status: session.status }, 403);
  }

  const now = new Date();
  if (session.starts_at && new Date(session.starts_at) > now) {
    return c.json({ error: 'Session has not started yet', startsAt: session.starts_at }, 403);
  }
  if (session.ends_at && new Date(session.ends_at) < now) {
    return c.json({ error: 'Session has ended', endsAt: session.ends_at }, 403);
  }

  const instructions = (session.instructions ?? '')
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  return c.json({
    session: {
      id: session.id,
      title: session.title,
      description: session.description,
      testType: session.test_type,
      instructions,
      timeLimitMinutes: session.time_limit_minutes,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      settings: session.settings_json ? JSON.parse(session.settings_json) : {},
      status: session.status,
    },
  });
});

// ─── POST /api/public/session/:token/start ───────────────────────────────────

app.post('/session/:token/start', rateLimitByIp({
  windowSeconds: 300,
  maxRequests: 3,
  message: 'Too many test start attempts. Please wait 5 minutes before trying again.',
}), async (c) => {
  const token = c.req.param('token');

  try {
    const body = await c.req.json();
    const data = startSchema.parse(body);

    const session = await queryOne<SessionRow>(
      c.env.DB,
      "SELECT id, status, test_type FROM test_sessions WHERE access_token = ? LIMIT 1",
      [token],
    );

    if (!session) return c.json({ error: 'Session not found' }, 404);
    if (session.status !== 'active') return c.json({ error: 'Session is not active' }, 403);

    // Upsert participant
    const email = data.email?.trim().toLowerCase() ?? null;
    let participant = email
      ? await queryOne<{ id: number }>(
          c.env.DB,
          'SELECT id FROM participants WHERE email = ? LIMIT 1',
          [email],
        )
      : null;

    if (!participant) {
      const result = await run(
        c.env.DB,
        `INSERT INTO participants (full_name, email, employee_code, department, position_title, latest_test_type, latest_status, last_activity_at)
         VALUES (?, ?, ?, ?, ?, ?, 'in_progress', CURRENT_TIMESTAMP)`,
        [data.fullName.trim(), email, data.employeeCode ?? null, data.department ?? null, data.positionTitle ?? null, session.test_type],
      );
      participant = { id: result.meta.last_row_id as number };
    } else {
      // Update name & latest info
      await run(
        c.env.DB,
        `UPDATE participants SET full_name = ?, latest_test_type = ?, latest_status = 'in_progress', last_activity_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [data.fullName.trim(), session.test_type, participant.id],
      );
    }

    // Count previous attempts
    const prevAttempt = await queryOne<{ cnt: number }>(
      c.env.DB,
      'SELECT COUNT(*) AS cnt FROM submissions WHERE session_id = ? AND participant_id = ?',
      [session.id, participant.id],
    );
    const attemptNo = Number(prevAttempt?.cnt ?? 0) + 1;

    const submissionToken = generateToken(16);
    const accessToken = generateToken(20);

    const subResult = await run(
      c.env.DB,
      `INSERT INTO submissions (session_id, participant_id, token, access_token, status, started_at, attempt_no)
       VALUES (?, ?, ?, ?, 'in_progress', CURRENT_TIMESTAMP, ?)`,
      [session.id, participant.id, submissionToken, accessToken, attemptNo],
    );

    const submissionId = subResult.meta.last_row_id as number;

    return c.json({
      submissionId,
      participantId: participant.id,
      token: submissionToken,
      submissionAccessToken: accessToken,
      status: 'in_progress',
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// ─── GET /api/public/submissions/:id/questions ───────────────────────────────

app.get('/submissions/:id/questions', async (c) => {
  const submissionId = parseInt(c.req.param('id'));
  const accessToken = c.req.header('X-Submission-Token') ?? c.req.query('token');
  const groupIndex = parseInt(c.req.query('groupIndex') ?? '0');

  if (!accessToken) {
    return c.json({ error: 'Submission token required' }, 401);
  }

  const submission = await queryOne<{ id: number; status: string; session_id: number }>(
    c.env.DB,
    'SELECT id, status, session_id FROM submissions WHERE id = ? AND access_token = ? LIMIT 1',
    [submissionId, accessToken],
  );

  if (!submission) return c.json({ error: 'Submission not found' }, 404);
  if (submission.status === 'submitted' || submission.status === 'scored') {
    return c.json({ error: 'Submission already completed' }, 409);
  }

  // Get session test type
  const session = await queryOne<{ id: number; test_type: string }>(
    c.env.DB,
    'SELECT id, test_type FROM test_sessions WHERE id = ? LIMIT 1',
    [submission.session_id],
  );

  if (!session) {
    return c.json({ submissionId, groupIndex, questions: [] });
  }

  // Get test_type_id
  const testType = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM test_types WHERE code = ? LIMIT 1',
    [session.test_type],
  );

  if (!testType) {
    return c.json({ submissionId, groupIndex, questions: [] });
  }

  // Fetch active questions from proper tables
  const questionRows = await query(
    c.env.DB,
    `SELECT
      q.id,
      q.test_type_id,
      q.question_code,
      q.instruction_text,
      q.prompt,
      q.question_group_key,
      q.dimension_key,
      q.question_type,
      q.question_order,
      q.is_required,
      q.status
    FROM questions q
    WHERE q.test_type_id = ? AND q.status = 'active'
    ORDER BY q.question_order ASC, q.id ASC`,
    [testType.id],
  );

  // For each question, fetch its options
  const questions = [];
  for (const qRow of questionRows.results ?? []) {
    const q = qRow as Record<string, unknown>;
    
    const optionRows = await query(
      c.env.DB,
      `SELECT
        id,
        option_key,
        option_text,
        dimension_key,
        value_number,
        is_correct,
        option_order
      FROM question_options
      WHERE question_id = ?
      ORDER BY option_order ASC`,
      [q.id],
    );

    questions.push({
      id: Number(q.id),
      testTypeId: Number(q.test_type_id),
      questionCode: String(q.question_code ?? ''),
      instructionText: q.instruction_text ? String(q.instruction_text) : null,
      prompt: q.prompt ? String(q.prompt) : null,
      questionGroupKey: q.question_group_key ? String(q.question_group_key) : null,
      dimensionKey: q.dimension_key ? String(q.dimension_key) : null,
      questionType: String(q.question_type),
      questionOrder: Number(q.question_order ?? 0),
      isRequired: Boolean(q.is_required),
      status: String(q.status),
      options: (optionRows.results ?? []).map((o) => {
        const opt = o as Record<string, unknown>;
        return {
          id: Number(opt.id),
          optionKey: String(opt.option_key),
          optionText: String(opt.option_text),
          dimensionKey: opt.dimension_key ? String(opt.dimension_key) : null,
          valueNumber: opt.value_number != null ? Number(opt.value_number) : null,
          isCorrect: Boolean(opt.is_correct),
          optionOrder: Number(opt.option_order ?? 0),
        };
      }),
    });
  }

  return c.json({
    submissionId,
    groupIndex,
    questions,
  });
});

// ─── POST /api/public/submissions/:id/answers ────────────────────────────────

app.post('/submissions/:id/answers', rateLimit({
  windowSeconds: 300,
  maxRequests: 60,
  keyFn: (c) => {
    const token = c.req.header('X-Submission-Token') ?? c.req.query('token') ?? 'unknown';
    return `sub:${token}`;
  },
  message: 'Too many answer save requests. Please wait before submitting again.',
}), async (c) => {
  const submissionId = parseInt(c.req.param('id'));
  const accessToken = c.req.header('X-Submission-Token') ?? c.req.query('token');

  if (!accessToken) {
    return c.json({ error: 'Submission token required' }, 401);
  }

  try {
    const body = await c.req.json();
    const { answers } = answersSchema.parse(body);

    const submission = await queryOne<{ id: number; status: string }>(
      c.env.DB,
      'SELECT id, status FROM submissions WHERE id = ? AND access_token = ? LIMIT 1',
      [submissionId, accessToken],
    );

    if (!submission) return c.json({ error: 'Submission not found' }, 404);
    if (submission.status !== 'in_progress') {
      return c.json({ error: 'Submission is not in progress' }, 409);
    }

    // Store answers as JSON in the result_json column
    await run(
      c.env.DB,
      'UPDATE submissions SET result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify({ answers, savedAt: new Date().toISOString() }), submissionId],
    );

    return c.json({ submissionId, saved: true, answersCount: answers.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// ─── POST /api/public/submissions/:id/submit ─────────────────────────────────

app.post('/submissions/:id/submit', rateLimit({
  windowSeconds: 300,
  maxRequests: 3,
  keyFn: (c) => {
    const token = c.req.header('X-Submission-Token') ?? c.req.query('token') ?? 'unknown';
    return `submit:${token}`;
  },
  message: 'Too many submit attempts. Please wait before trying again.',
}), async (c) => {
  const submissionId = parseInt(c.req.param('id'));
  const accessToken = c.req.header('X-Submission-Token') ?? c.req.query('token');

  if (!accessToken) {
    return c.json({ error: 'Submission token required' }, 401);
  }

  const submission = await queryOne<{
    id: number;
    status: string;
    session_id: number;
    participant_id: number;
    result_json: string | null;
  }>(
    c.env.DB,
    'SELECT id, status, session_id, participant_id, result_json FROM submissions WHERE id = ? AND access_token = ? LIMIT 1',
    [submissionId, accessToken],
  );

  if (!submission) return c.json({ error: 'Submission not found' }, 404);
  if (submission.status === 'submitted' || submission.status === 'scored') {
    return c.json({ error: 'Submission already completed' }, 409);
  }

  // Fetch session test type
  const session = await queryOne<{ id: number; test_type: string }>(
    c.env.DB,
    'SELECT id, test_type FROM test_sessions WHERE id = ? LIMIT 1',
    [submission.session_id],
  );

  // Parse stored answers for scoring
  let scoredQuestions: ScoredQuestion[] = [];
  let submissionAnswers: SubmissionAnswer[] = [];
  
  if (submission.result_json) {
    try {
      const parsed = JSON.parse(submission.result_json);
      submissionAnswers = parsed.answers ?? [];
    } catch {
      // Invalid JSON - continue without scoring
    }
  }

  // Get test_type_id
  const testType = session ? await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM test_types WHERE code = ? LIMIT 1',
    [session.test_type],
  ) : null;

  // Fetch questions with options for scoring
  if (testType && submissionAnswers.length > 0) {
    const questionRows = await query(
      c.env.DB,
      `SELECT
        q.id,
        q.test_type_id,
        q.question_code,
        q.dimension_key,
        q.question_type
      FROM questions q
      WHERE q.test_type_id = ? AND q.status = 'active'
      ORDER BY q.question_order ASC, q.id ASC`,
      [testType.id],
    );

    for (const qRow of questionRows.results ?? []) {
      const q = qRow as Record<string, unknown>;
      
      const optionRows = await query(
        c.env.DB,
        `SELECT
          id,
          option_key,
          option_text,
          dimension_key,
          value_number,
          is_correct,
          option_order
        FROM question_options
        WHERE question_id = ?
        ORDER BY option_order ASC`,
        [q.id],
      );

      scoredQuestions.push({
        id: Number(q.id),
        testTypeId: Number(q.test_type_id),
        testType: session?.test_type ?? '',
        questionCode: String(q.question_code ?? ''),
        dimensionKey: q.dimension_key ? String(q.dimension_key) : null,
        questionType: String(q.question_type),
        options: (optionRows.results ?? []).map((o) => {
          const opt = o as Record<string, unknown>;
          return {
            id: Number(opt.id),
            optionKey: String(opt.option_key),
            optionText: String(opt.option_text),
            dimensionKey: opt.dimension_key ? String(opt.dimension_key) : null,
            valueNumber: opt.value_number != null ? Number(opt.value_number) : null,
            isCorrect: Boolean(opt.is_correct),
            optionOrder: Number(opt.option_order ?? 0),
            scorePayload: null,
          };
        }),
      });
    }
  }

  // Calculate scores using the scoring module
  let scoreTotal: number | null = null;
  let scoreBand: string | null = null;
  let profileCode: string | null = null;
  let primaryType: string | null = null;
  let resultPayload: Record<string, unknown> = { answers: submissionAnswers, submittedAt: new Date().toISOString() };

  if (session && scoredQuestions.length > 0 && submissionAnswers.length > 0) {
    try {
      const testTypeCode = session.test_type.toLowerCase() as 'iq' | 'disc' | 'workload';
      
      const scoringResult = createScoringResult(testTypeCode, scoredQuestions, submissionAnswers);
      resultPayload = { ...resultPayload, ...scoringResult };

      if (scoringResult.testType === 'iq' && scoringResult.iqResult) {
        scoreTotal = scoringResult.iqResult.totalScore;
        scoreBand = scoringResult.iqResult.band;
        resultPayload = { ...resultPayload, iqResult: scoringResult.iqResult };
      } else if (scoringResult.testType === 'disc' && scoringResult.discResult) {
        primaryType = scoringResult.discResult.primaryType;
        profileCode = scoringResult.discResult.profilePattern;
        resultPayload = { ...resultPayload, discResult: scoringResult.discResult };
      } else if (scoringResult.testType === 'workload' && scoringResult.workloadResult) {
        scoreTotal = Math.round(scoringResult.workloadResult.overallScore * 10);
        scoreBand = scoringResult.workloadResult.band;
        resultPayload = { ...resultPayload, workloadResult: scoringResult.workloadResult };
      }
    } catch (scoringError) {
      console.error('[scoring] Error during scoring:', scoringError);
      // Continue without scores
    }
  }

  // Mark as submitted
  await run(
    c.env.DB,
    "UPDATE submissions SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?",
    [submissionId],
  );

  // Update participant latest status
  await run(
    c.env.DB,
    "UPDATE participants SET latest_status = 'submitted', last_activity_at = CURRENT_TIMESTAMP WHERE id = ?",
    [submission.participant_id],
  );

  // Create result record
  let resultId: number | null = null;

  if (session && testType) {
    const resultInsert = await run(
      c.env.DB,
      `INSERT INTO results (
        submission_id, participant_id, test_type_id, test_type,
        score_total, score_band, profile_code, primary_type,
        result_payload_json, review_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scored_preliminary', CURRENT_TIMESTAMP)`,
      [
        submissionId,
        submission.participant_id,
        testType.id,
        session.test_type,
        scoreTotal,
        scoreBand,
        profileCode,
        primaryType,
        JSON.stringify(resultPayload),
      ],
    );
    resultId = resultInsert.meta.last_row_id as number;

    // Insert result_summaries for dimension breakdowns
    if (resultPayload.iqResult && resultId) {
      const iq = resultPayload.iqResult as Record<string, unknown>;
      const dims = iq.dimensions as Record<string, { correct: number; total: number; percentage: number }>;
      
      if (dims) {
        for (const [dim, data] of Object.entries(dims)) {
          await run(
            c.env.DB,
            `INSERT INTO result_summaries (result_id, metric_key, metric_label, metric_type, score, band, sort_order)
             VALUES (?, ?, ?, 'dimension', ?, ?, ?)`,
            [resultId, dim, dim.charAt(0).toUpperCase() + dim.slice(1), data.percentage, null, 1],
          );
        }
      }
    }

    if (resultPayload.discResult && resultId) {
      const disc = resultPayload.discResult as Record<string, unknown>;
      const scores = disc.scores as Record<string, number>;
      
      if (scores) {
        const dims = ['D', 'I', 'S', 'C'];
        for (let i = 0; i < dims.length; i++) {
          await run(
            c.env.DB,
            `INSERT INTO result_summaries (result_id, metric_key, metric_label, metric_type, score, band, sort_order)
             VALUES (?, ?, ?, 'dimension', ?, null, ?)`,
            [resultId, dims[i].toLowerCase(), dims[i], scores[dims[i]] ?? 0, i + 1],
          );
        }
      }
    }

    if (resultPayload.workloadResult && resultId) {
      const workload = resultPayload.workloadResult as Record<string, unknown>;
      const dims = workload.dimensions as Record<string, number>;
      
      if (dims) {
        const dimLabels: Record<string, string> = {
          mental_demand: 'Mental Demand',
          physical_demand: 'Physical Demand',
          temporal_demand: 'Temporal Demand',
          performance: 'Performance',
          effort: 'Effort',
          frustration: 'Frustration',
        };
        let order = 1;
        for (const [key, value] of Object.entries(dims)) {
          await run(
            c.env.DB,
            `INSERT INTO result_summaries (result_id, metric_key, metric_label, metric_type, score, band, sort_order)
             VALUES (?, ?, ?, 'dimension', ?, null, ?)`,
            [resultId, key, dimLabels[key] || key, value, order++],
          );
        }
      }
    }

    // Mark submission as scored
    await run(
      c.env.DB,
      "UPDATE submissions SET status = 'scored' WHERE id = ?",
      [submissionId],
    );

    // Update participant latest status to scored
    await run(
      c.env.DB,
      "UPDATE participants SET latest_status = 'scored' WHERE id = ?",
      [submission.participant_id],
    );
  }

  return c.json({
    submissionId,
    status: 'submitted',
    testType: session?.test_type ?? null,
    resultId,
    scoreTotal,
    scoreBand,
    primaryType,
    profileCode,
    message: 'Test submitted successfully. Your results have been processed.',
  });
});

export default app;