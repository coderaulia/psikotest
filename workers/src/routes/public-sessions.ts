import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
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
    answer: z.union([z.string(), z.number(), z.null()]),
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

app.post('/session/:token/start', async (c) => {
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

  // NOTE: Questions are stored externally / seeded into D1.
  // For now return empty — the front-end falls back to local question bank.
  // TODO: Implement question bank in D1 and join here.
  return c.json({
    submissionId,
    groupIndex,
    questions: [],
  });
});

// ─── POST /api/public/submissions/:id/answers ────────────────────────────────

app.post('/submissions/:id/answers', async (c) => {
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

    // Store answers as JSON in the result_json column for now
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

app.post('/submissions/:id/submit', async (c) => {
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

  // Fetch session test type for scoring
  const session = await queryOne<{ test_type: string }>(
    c.env.DB,
    'SELECT test_type FROM test_sessions WHERE id = ? LIMIT 1',
    [submission.session_id],
  );

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

  // Auto-score if answers are present (basic scoring — expand per test type)
  // For a full implementation, scoring logic per test type should live in
  // workers/src/lib/scoring/<test-type>.ts
  const resultId: number | null = null;

  return c.json({
    submissionId,
    status: 'submitted',
    testType: session?.test_type ?? null,
    resultId,
    message: 'Test submitted successfully. Results will be processed shortly.',
  });
});

export default app;