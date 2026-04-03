import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { createScoringResult, type ScoredQuestion, type SubmissionAnswer } from '../lib/scoring';
import { rateLimitByIp, rateLimit } from '../middleware/rate-limit';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

type SessionSettings = ReturnType<typeof getDefaultSettings>;

interface SessionLookupRow {
  id: number;
  title: string;
  description: string | null;
  status: string;
  access_token: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  settings_json: string | null;
  protected_delivery_mode: number | null;
  starts_at: string | null;
  ends_at: string | null;
  test_type_id: number;
  test_type_code: string;
}

interface SubmissionAccessRow {
  id: number;
  status: string;
  participant_id: number;
  test_session_id: number | null;
  session_id: number | null;
  answer_sequence: number;
  current_group: number | null;
  total_groups: number | null;
  started_at: string | null;
  created_at: string;
  session_status: string;
  settings_json: string | null;
  protected_delivery_mode: number | null;
  test_type_id: number;
  test_type_code: string;
}

interface PublicAnswerInput {
  questionId: number;
  selectedOptionId?: number;
  mostOptionId?: number;
  leastOptionId?: number;
  value?: number;
}

function generateToken(length = 24): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getDefaultSettings() {
  return {
    assessmentPurpose: 'recruitment' as const,
    administrationMode: 'remote_unsupervised' as const,
    interpretationMode: 'professional_review' as const,
    participantResultMode: 'instant_summary' as const,
    participantLimit: null as number | null,
    contactPerson: 'HR Assessment Desk',
    consentStatement:
      'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
    privacyStatement:
      'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
    distributionPolicy: 'participant_summary' as const,
    protectedDeliveryMode: false,
    participantResultAccess: 'summary' as const,
    hrResultAccess: 'full' as const,
  };
}

function parseSettings(settingsJson: string | null): SessionSettings {
  const defaults = getDefaultSettings();
  if (!settingsJson) return defaults;

  try {
    const parsed = JSON.parse(settingsJson) as Record<string, unknown>;
    return {
      assessmentPurpose: (parsed.assessmentPurpose as SessionSettings['assessmentPurpose']) ?? defaults.assessmentPurpose,
      administrationMode: (parsed.administrationMode as SessionSettings['administrationMode']) ?? defaults.administrationMode,
      interpretationMode: (parsed.interpretationMode as SessionSettings['interpretationMode']) ?? defaults.interpretationMode,
      participantResultMode: (parsed.participantResultMode as SessionSettings['participantResultMode']) ?? defaults.participantResultMode,
      participantLimit: typeof parsed.participantLimit === 'number' ? parsed.participantLimit : defaults.participantLimit,
      contactPerson: typeof parsed.contactPerson === 'string' ? parsed.contactPerson : defaults.contactPerson,
      consentStatement: typeof parsed.consentStatement === 'string' ? parsed.consentStatement : defaults.consentStatement,
      privacyStatement: typeof parsed.privacyStatement === 'string' ? parsed.privacyStatement : defaults.privacyStatement,
      distributionPolicy: (parsed.distributionPolicy as SessionSettings['distributionPolicy']) ?? defaults.distributionPolicy,
      protectedDeliveryMode: Boolean(parsed.protectedDeliveryMode ?? defaults.protectedDeliveryMode),
      participantResultAccess:
        (parsed.participantResultAccess as SessionSettings['participantResultAccess']) ?? defaults.participantResultAccess,
      hrResultAccess: (parsed.hrResultAccess as SessionSettings['hrResultAccess']) ?? defaults.hrResultAccess,
    };
  } catch {
    return defaults;
  }
}

function normalizeInstructions(instructions: string | null): string[] {
  return (instructions ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getEstimatedMinutes(testTypeCode: string): number {
  if (testTypeCode === 'disc') return 10;
  if (testTypeCode === 'iq') return 15;
  if (testTypeCode === 'workload') return 12;
  return 10;
}

function parseSubmissionToken(c: { req: { header: (name: string) => string | undefined; query: (name: string) => string | undefined } }): string | null {
  const authorization = c.req.header('Authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const legacyToken = c.req.header('X-Submission-Token');
  if (legacyToken?.trim()) return legacyToken.trim();

  const queryToken = c.req.query('token');
  if (queryToken?.trim()) return queryToken.trim();

  return null;
}

function submissionIsExpired(row: SubmissionAccessRow): boolean {
  const base = row.started_at ?? row.created_at;
  const startedAtMs = Date.parse(base);
  if (!Number.isFinite(startedAtMs)) return false;
  const expiresAtMs = startedAtMs + (4 * 60 * 60 * 1000);
  return Date.now() > expiresAtMs;
}

function makeInClause(count: number): string {
  return new Array(count).fill('?').join(', ');
}

async function loadSessionByAccessToken(db: D1Database, token: string): Promise<SessionLookupRow | null> {
  return queryOne<SessionLookupRow>(
    db,
    `SELECT
      ts.id,
      ts.title,
      ts.description,
      ts.status,
      ts.access_token,
      ts.instructions,
      ts.time_limit_minutes,
      ts.settings_json,
      ts.protected_delivery_mode,
      ts.starts_at,
      ts.ends_at,
      ts.test_type_id,
      tt.code AS test_type_code
    FROM test_sessions ts
    INNER JOIN test_types tt ON tt.id = ts.test_type_id
    WHERE ts.access_token = ?
    LIMIT 1`,
    [token],
  );
}

async function loadSubmissionForAccess(db: D1Database, submissionId: number, accessToken: string): Promise<SubmissionAccessRow | null> {
  return queryOne<SubmissionAccessRow>(
    db,
    `SELECT
      s.id,
      s.status,
      s.participant_id,
      s.test_session_id,
      s.session_id,
      s.answer_sequence,
      s.current_group,
      s.total_groups,
      s.started_at,
      s.created_at,
      ts.status AS session_status,
      ts.settings_json,
      ts.protected_delivery_mode,
      ts.test_type_id,
      tt.code AS test_type_code
    FROM submissions s
    INNER JOIN test_sessions ts ON ts.id = COALESCE(s.test_session_id, s.session_id)
    INNER JOIN test_types tt ON tt.id = ts.test_type_id
    WHERE s.id = ? AND s.access_token = ?
    LIMIT 1`,
    [submissionId, accessToken],
  );
}

function getGroupSizeForTestType(testTypeCode: string, totalQuestions: number): number {
  const normalizedType = testTypeCode.toLowerCase();
  if (normalizedType === 'iq') return 10;
  if (normalizedType === 'disc') return Math.max(1, totalQuestions);
  if (normalizedType === 'workload') return Math.max(1, totalQuestions);
  return 10;
}

function computeTotalGroups(totalQuestions: number, groupSize: number): number {
  if (totalQuestions <= 0) return 1;
  return Math.max(1, Math.ceil(totalQuestions / Math.max(1, groupSize)));
}

function getQuestionSliceForGroup<T>(questions: T[], groupIndex: number, groupSize: number): T[] {
  const safeSize = Math.max(1, groupSize);
  const safeGroupIndex = Math.max(0, groupIndex);
  const offset = safeGroupIndex * safeSize;
  return questions.slice(offset, offset + safeSize);
}

function clampGroupIndex(groupIndex: number, totalGroups: number): number {
  if (!Number.isFinite(groupIndex)) return 0;
  return Math.max(0, Math.min(groupIndex, Math.max(0, totalGroups - 1)));
}

async function fetchQuestionsWithOptions(db: D1Database, testTypeId: number) {
  const questionRows = await query(
    db,
    `SELECT
      id,
      question_code,
      instruction_text,
      prompt,
      question_group_key,
      dimension_key,
      question_type,
      question_order
    FROM questions
    WHERE test_type_id = ? AND status = 'active'
    ORDER BY question_order ASC, id ASC`,
    [testTypeId],
  );

  const questions = (questionRows.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: Number(item.id),
      code: String(item.question_code ?? ''),
      instructionText: item.instruction_text ? String(item.instruction_text) : null,
      prompt: item.prompt ? String(item.prompt) : null,
      questionGroupKey: item.question_group_key ? String(item.question_group_key) : null,
      dimensionKey: item.dimension_key ? String(item.dimension_key) : null,
      questionType: String(item.question_type),
      orderIndex: Number(item.question_order ?? 0),
      options: [] as Array<{
        id: number;
        key: string;
        label: string;
        dimensionKey?: string;
        value?: number;
      }>,
    };
  });

  for (const question of questions) {
    const optionRows = await query(
      db,
      `SELECT
        id,
        option_key,
        option_text,
        dimension_key,
        value_number,
        option_order
      FROM question_options
      WHERE question_id = ?
      ORDER BY option_order ASC, id ASC`,
      [question.id],
    );

    question.options = (optionRows.results ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        id: Number(item.id),
        key: String(item.option_key ?? ''),
        label: String(item.option_text ?? ''),
        dimensionKey: item.dimension_key ? String(item.dimension_key) : undefined,
        value: item.value_number != null ? Number(item.value_number) : undefined,
      };
    });
  }

  return questions;
}

async function loadSavedAnswers(db: D1Database, submissionId: number): Promise<PublicAnswerInput[]> {
  const rows = await query(
    db,
    `SELECT question_id, answer_role, selected_option_id, value_number
     FROM answers
     WHERE submission_id = ?
     ORDER BY id ASC`,
    [submissionId],
  );

  const answerMap = new Map<number, PublicAnswerInput>();

  for (const row of rows.results ?? []) {
    const item = row as Record<string, unknown>;
    const questionId = Number(item.question_id);
    const role = String(item.answer_role ?? 'selected');
    const selectedOptionId = item.selected_option_id != null ? Number(item.selected_option_id) : undefined;
    const value = item.value_number != null ? Number(item.value_number) : undefined;

    const current = answerMap.get(questionId) ?? { questionId };

    if (role === 'most' && selectedOptionId) {
      current.mostOptionId = selectedOptionId;
    } else if (role === 'least' && selectedOptionId) {
      current.leastOptionId = selectedOptionId;
    } else {
      if (selectedOptionId) {
        current.selectedOptionId = selectedOptionId;
      }
      if (typeof value === 'number') {
        current.value = value;
      }
    }

    answerMap.set(questionId, current);
  }

  return Array.from(answerMap.values());
}

function countAnsweredItems(savedAnswers: PublicAnswerInput[]): number {
  return savedAnswers.filter((answer) => {
    if (answer.mostOptionId || answer.leastOptionId) {
      return Boolean(answer.mostOptionId && answer.leastOptionId);
    }
    return typeof answer.selectedOptionId === 'number' || typeof answer.value === 'number';
  }).length;
}

async function persistAnswers(
  db: D1Database,
  submission: SubmissionAccessRow,
  answers: PublicAnswerInput[],
  requestedSequence: number,
) {
  if (requestedSequence <= submission.answer_sequence) {
    return {
      error: 'Answer sequence is out of date',
      status: 409 as const,
    };
  }

  if (answers.length === 0) {
    await run(
      db,
      'UPDATE submissions SET answer_sequence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [requestedSequence, submission.id],
    );
    const savedAnswers = await loadSavedAnswers(db, submission.id);
    return {
      answerSequence: requestedSequence,
      answeredQuestionCount: countAnsweredItems(savedAnswers),
    };
  }

  const questionIds = Array.from(new Set(answers.map((answer) => answer.questionId)));
  const questionRows = await query(
    db,
    `SELECT id, question_type
     FROM questions
     WHERE test_type_id = ? AND status = 'active' AND id IN (${makeInClause(questionIds.length)})`,
    [submission.test_type_id, ...questionIds],
  );

  const questionTypeMap = new Map<number, string>();
  for (const row of questionRows.results ?? []) {
    const item = row as Record<string, unknown>;
    questionTypeMap.set(Number(item.id), String(item.question_type ?? 'single_choice'));
  }

  if (questionTypeMap.size !== questionIds.length) {
    return {
      error: 'Some answers refer to invalid questions for this session',
      status: 400 as const,
    };
  }

  const optionIds = Array.from(
    new Set(
      answers.flatMap((answer) => [
        answer.selectedOptionId,
        answer.mostOptionId,
        answer.leastOptionId,
      ].filter((value): value is number => typeof value === 'number')),
    ),
  );

  const optionOwnerMap = new Map<number, number>();
  if (optionIds.length > 0) {
    const optionRows = await query(
      db,
      `SELECT id, question_id
       FROM question_options
       WHERE id IN (${makeInClause(optionIds.length)})`,
      optionIds,
    );
    for (const row of optionRows.results ?? []) {
      const item = row as Record<string, unknown>;
      optionOwnerMap.set(Number(item.id), Number(item.question_id));
    }
  }

  for (const answer of answers) {
    const optionIdsForAnswer = [answer.selectedOptionId, answer.mostOptionId, answer.leastOptionId]
      .filter((value): value is number => typeof value === 'number');
    for (const optionId of optionIdsForAnswer) {
      const ownerQuestionId = optionOwnerMap.get(optionId);
      if (ownerQuestionId !== answer.questionId) {
        return {
          error: 'Some selected options are invalid for the referenced question',
          status: 400 as const,
        };
      }
    }
  }

  for (const answer of answers) {
    await run(
      db,
      'DELETE FROM answers WHERE submission_id = ? AND question_id = ?',
      [submission.id, answer.questionId],
    );

    const questionType = questionTypeMap.get(answer.questionId);

    if (questionType === 'forced_choice') {
      if (answer.mostOptionId) {
        await run(
          db,
          `INSERT INTO answers (submission_id, question_id, answer_role, selected_option_id, created_at)
           VALUES (?, ?, 'most', ?, CURRENT_TIMESTAMP)`,
          [submission.id, answer.questionId, answer.mostOptionId],
        );
      }
      if (answer.leastOptionId) {
        await run(
          db,
          `INSERT INTO answers (submission_id, question_id, answer_role, selected_option_id, created_at)
           VALUES (?, ?, 'least', ?, CURRENT_TIMESTAMP)`,
          [submission.id, answer.questionId, answer.leastOptionId],
        );
      }
      continue;
    }

    await run(
      db,
      `INSERT INTO answers (submission_id, question_id, answer_role, selected_option_id, value_number, created_at)
       VALUES (?, ?, 'selected', ?, ?, CURRENT_TIMESTAMP)`,
      [submission.id, answer.questionId, answer.selectedOptionId ?? null, answer.value ?? null],
    );
  }

  await run(
    db,
    'UPDATE submissions SET answer_sequence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [requestedSequence, submission.id],
  );

  const savedAnswers = await loadSavedAnswers(db, submission.id);
  return {
    answerSequence: requestedSequence,
    answeredQuestionCount: countAnsweredItems(savedAnswers),
  };
}

function toSubmissionAnswers(savedAnswers: PublicAnswerInput[]): SubmissionAnswer[] {
  return savedAnswers.map((answer) => ({
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    mostOptionId: answer.mostOptionId,
    leastOptionId: answer.leastOptionId,
    likertValue: typeof answer.value === 'number' ? answer.value : undefined,
  }));
}

async function buildScoredQuestions(db: D1Database, testTypeId: number, testTypeCode: string): Promise<ScoredQuestion[]> {
  const questions = await query(
    db,
    `SELECT id, question_code, dimension_key, question_type
     FROM questions
     WHERE test_type_id = ? AND status = 'active'
     ORDER BY question_order ASC, id ASC`,
    [testTypeId],
  );

  const scoredQuestions: ScoredQuestion[] = [];
  for (const questionRow of questions.results ?? []) {
    const question = questionRow as Record<string, unknown>;
    const optionRows = await query(
      db,
      `SELECT id, option_key, option_text, dimension_key, value_number, is_correct, option_order
       FROM question_options
       WHERE question_id = ?
       ORDER BY option_order ASC, id ASC`,
      [Number(question.id)],
    );

    scoredQuestions.push({
      id: Number(question.id),
      testTypeId,
      testType: testTypeCode,
      questionCode: String(question.question_code ?? ''),
      dimensionKey: question.dimension_key ? String(question.dimension_key) : null,
      questionType: String(question.question_type ?? 'single_choice'),
      options: (optionRows.results ?? []).map((optionRow) => {
        const option = optionRow as Record<string, unknown>;
        return {
          id: Number(option.id),
          optionKey: String(option.option_key ?? ''),
          optionText: String(option.option_text ?? ''),
          dimensionKey: option.dimension_key ? String(option.dimension_key) : null,
          valueNumber: option.value_number != null ? Number(option.value_number) : null,
          isCorrect: Boolean(option.is_correct),
          optionOrder: Number(option.option_order ?? 0),
          scorePayload: null,
        };
      }),
    });
  }

  return scoredQuestions;
}

function parseResultPayload(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadResultDetailForSubmission(db: D1Database, submissionId: number) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    `SELECT
      r.id,
      r.submission_id,
      r.participant_id,
      r.test_type,
      r.score_total,
      r.score_band,
      r.primary_type,
      r.secondary_type,
      r.profile_code,
      r.interpretation_key,
      r.review_status,
      r.review_started_at,
      r.reviewed_at,
      r.reviewer_admin_id,
      r.released_at,
      r.released_by_admin_id,
      r.professional_summary,
      r.recommendation,
      r.limitations,
      r.reviewer_notes,
      r.distribution_policy,
      r.participant_result_access,
      r.hr_result_access,
      r.protected_delivery_mode,
      r.result_payload_json,
      p.full_name AS participant_name,
      p.email AS participant_email,
      p.employee_code,
      p.department,
      p.position_title,
      ts.id AS test_session_id,
      ts.title AS session_title,
      ts.access_token,
      COALESCE(s.submitted_at, r.created_at) AS submitted_at
    FROM results r
    INNER JOIN submissions s ON s.id = r.submission_id
    INNER JOIN participants p ON p.id = s.participant_id
    INNER JOIN test_sessions ts ON ts.id = COALESCE(s.test_session_id, s.session_id)
    WHERE r.submission_id = ?
    LIMIT 1`,
    [submissionId],
  );

  if (!row) return null;

  const summaryRows = await query(
    db,
    `SELECT metric_key, metric_label, score, band
     FROM result_summaries
     WHERE result_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [Number(row.id)],
  );

  const summaries = (summaryRows.results ?? []).map((summaryRow) => {
    const summary = summaryRow as Record<string, unknown>;
    return {
      metricKey: String(summary.metric_key ?? ''),
      metricLabel: String(summary.metric_label ?? ''),
      score: Number(summary.score ?? 0),
      band: summary.band ? String(summary.band) : null,
    };
  });

  const payload = parseResultPayload(row.result_payload_json ? String(row.result_payload_json) : null);

  return {
    id: Number(row.id),
    submissionId: Number(row.submission_id),
    participantId: Number(row.participant_id),
    participantName: String(row.participant_name ?? ''),
    participantEmail: String(row.participant_email ?? ''),
    department: row.department ? String(row.department) : null,
    positionTitle: row.position_title ? String(row.position_title) : null,
    sessionId: Number(row.test_session_id),
    sessionTitle: String(row.session_title ?? ''),
    accessToken: String(row.access_token ?? ''),
    testType: String(row.test_type ?? 'disc'),
    submittedAt: row.submitted_at ? String(row.submitted_at) : new Date().toISOString(),
    scoreTotal: row.score_total != null ? Number(row.score_total) : null,
    scoreBand: row.score_band ? String(row.score_band) : null,
    primaryType: row.primary_type ? String(row.primary_type) : null,
    secondaryType: row.secondary_type ? String(row.secondary_type) : null,
    profileCode: row.profile_code ? String(row.profile_code) : null,
    interpretationKey: row.interpretation_key ? String(row.interpretation_key) : null,
    reviewStatus: String(row.review_status ?? 'scored_preliminary'),
    reviewStartedAt: row.review_started_at ? String(row.review_started_at) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewedByAdminId: row.reviewer_admin_id ? Number(row.reviewer_admin_id) : null,
    reviewerAdminId: row.reviewer_admin_id ? Number(row.reviewer_admin_id) : null,
    releasedAt: row.released_at ? String(row.released_at) : null,
    releasedByAdminId: row.released_by_admin_id ? Number(row.released_by_admin_id) : null,
    professionalSummary: row.professional_summary ? String(row.professional_summary) : null,
    recommendation: row.recommendation ? String(row.recommendation) : null,
    limitations: row.limitations ? String(row.limitations) : null,
    reviewerNotes: row.reviewer_notes ? String(row.reviewer_notes) : null,
    distributionPolicy: String(row.distribution_policy ?? 'participant_summary'),
    participantResultAccess: String(row.participant_result_access ?? 'summary'),
    hrResultAccess: String(row.hr_result_access ?? 'full'),
    protectedDeliveryMode: Boolean(row.protected_delivery_mode),
    resultPayload: payload,
    summaries,
    participant: {
      id: Number(row.participant_id),
      fullName: String(row.participant_name ?? ''),
      email: String(row.participant_email ?? ''),
      employeeCode: row.employee_code ? String(row.employee_code) : null,
      department: row.department ? String(row.department) : null,
      positionTitle: row.position_title ? String(row.position_title) : null,
    },
    session: {
      id: Number(row.test_session_id),
      title: String(row.session_title ?? ''),
      accessToken: String(row.access_token ?? ''),
      testType: String(row.test_type ?? 'disc'),
    },
  };
}

const startSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  positionTitle: z.string().optional(),
  position: z.string().optional(),
  appliedPosition: z.string().optional(),
  age: z.number().int().min(10).max(100).optional(),
  educationLevel: z.string().optional(),
});

const answerItemSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOptionId: z.number().int().positive().optional(),
  mostOptionId: z.number().int().positive().optional(),
  leastOptionId: z.number().int().positive().optional(),
  value: z.number().optional(),
});

const saveAnswersSchema = z.object({
  answerSequence: z.number().int().positive(),
  answers: z.array(answerItemSchema),
});

const submitSchema = z.object({
  answerSequence: z.number().int().positive().optional(),
  answers: z.array(answerItemSchema).optional(),
});

async function handleGetSession(c: { req: { param: (name: string) => string }; env: Env; json: (obj: unknown, status?: number) => Response }) {
  const token = c.req.param('token');

  try {
    const session = await loadSessionByAccessToken(c.env.DB, token);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.status !== 'active') {
      return c.json({ error: 'Session is not active', status: session.status }, 403);
    }

    const now = Date.now();
    if (session.starts_at && Number.isFinite(Date.parse(session.starts_at)) && Date.parse(session.starts_at) > now) {
      return c.json({ error: 'Session has not started yet', startsAt: session.starts_at }, 403);
    }
    if (session.ends_at && Number.isFinite(Date.parse(session.ends_at)) && Date.parse(session.ends_at) < now) {
      return c.json({ error: 'Session has ended', endsAt: session.ends_at }, 403);
    }

    const settings = parseSettings(session.settings_json);
    const countRow = await queryOne<{ total: number }>(
      c.env.DB,
      `SELECT COUNT(*) AS total
       FROM questions
       WHERE test_type_id = ? AND status = 'active'`,
      [session.test_type_id],
    );

    const totalQuestions = Number(countRow?.total ?? 0);
    const groupSize = getGroupSizeForTestType(session.test_type_code, totalQuestions);
    const totalGroups = computeTotalGroups(totalQuestions, groupSize);
    const protectedMode = Boolean(session.protected_delivery_mode) || settings.protectedDeliveryMode;
    const deliveryMode = protectedMode ? 'progressive' : 'full';

    return c.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        testType: session.test_type_code,
        instructions: normalizeInstructions(session.instructions),
        estimatedMinutes: session.time_limit_minutes ?? getEstimatedMinutes(session.test_type_code),
        status: 'active',
        timeLimitMinutes: session.time_limit_minutes,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
        compliance: settings,
        delivery: {
          mode: deliveryMode,
          totalQuestions,
          totalGroups: protectedMode ? totalGroups : 1,
        },
      },
      questions: [],
    });
  } catch (error) {
    console.error('[public/session] lookup error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
}

app.get('/session/:token', handleGetSession);
app.get('/sessions/:token', handleGetSession);

async function handleStartSession(c: { req: { param: (name: string) => string; json: () => Promise<unknown> }; env: Env; json: (obj: unknown, status?: number) => Response }) {
  const token = c.req.param('token');

  try {
    const body = await c.req.json();
    const data = startSchema.parse(body);

    const session = await loadSessionByAccessToken(c.env.DB, token);
    if (!session) return c.json({ error: 'Session not found' }, 404);
    if (session.status !== 'active') return c.json({ error: 'Session is not active' }, 403);

    const now = Date.now();
    if (session.starts_at && Number.isFinite(Date.parse(session.starts_at)) && Date.parse(session.starts_at) > now) {
      return c.json({ error: 'Session has not started yet' }, 403);
    }
    if (session.ends_at && Number.isFinite(Date.parse(session.ends_at)) && Date.parse(session.ends_at) < now) {
      return c.json({ error: 'Session has ended' }, 403);
    }

    const normalizedEmail = data.email?.trim().toLowerCase() || null;
    const positionTitle = data.positionTitle ?? data.position ?? null;
    const participantMetadata = {
      appliedPosition: data.appliedPosition ?? null,
      age: typeof data.age === 'number' ? data.age : null,
      educationLevel: data.educationLevel ?? null,
      consentAccepted: true,
      consentAcceptedAt: new Date().toISOString(),
    };

    let participantId: number;
    const existingParticipant = normalizedEmail
      ? await queryOne<{ id: number }>(
          c.env.DB,
          'SELECT id FROM participants WHERE email = ? LIMIT 1',
          [normalizedEmail],
        )
      : null;

    if (existingParticipant) {
      participantId = existingParticipant.id;
      await run(
        c.env.DB,
        `UPDATE participants
         SET full_name = ?, employee_code = ?, department = ?, position_title = ?, metadata_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          data.fullName.trim(),
          data.employeeCode?.trim() || null,
          data.department?.trim() || null,
          positionTitle?.trim() || null,
          JSON.stringify(participantMetadata),
          participantId,
        ],
      );
    } else {
      const participantInsert = await run(
        c.env.DB,
        `INSERT INTO participants
          (full_name, email, employee_code, department, position_title, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          data.fullName.trim(),
          normalizedEmail,
          data.employeeCode?.trim() || null,
          data.department?.trim() || null,
          positionTitle?.trim() || null,
          JSON.stringify(participantMetadata),
        ],
      );
      participantId = Number(participantInsert.meta.last_row_id);
    }

    const attempts = await queryOne<{ count: number }>(
      c.env.DB,
      'SELECT COUNT(*) AS count FROM submissions WHERE COALESCE(test_session_id, session_id) = ? AND participant_id = ?',
      [session.id, participantId],
    );
    const attemptNo = Number(attempts?.count ?? 0) + 1;

    const submissionToken = generateToken(16);
    const submissionAccessToken = generateToken(20);
    const submissionAccessExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const settings = parseSettings(session.settings_json);
    const protectedMode = Boolean(session.protected_delivery_mode) || settings.protectedDeliveryMode;
    const questionCountRow = await queryOne<{ total: number }>(
      c.env.DB,
      `SELECT COUNT(*) AS total
       FROM questions
       WHERE test_type_id = ? AND status = 'active'`,
      [session.test_type_id],
    );
    const totalQuestionCount = Number(questionCountRow?.total ?? 0);
    const groupSize = getGroupSizeForTestType(session.test_type_code, totalQuestionCount);
    const totalGroups = protectedMode
      ? computeTotalGroups(totalQuestionCount, groupSize)
      : 1;

    const submissionInsert = await run(
      c.env.DB,
      `INSERT INTO submissions
        (test_session_id, session_id, participant_id, attempt_no, status, answer_sequence, current_group, total_groups, token, access_token, started_at, created_at)
       VALUES (?, ?, ?, ?, 'in_progress', 0, 0, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [session.id, session.id, participantId, attemptNo, totalGroups, submissionToken, submissionAccessToken],
    );
    const submissionId = Number(submissionInsert.meta.last_row_id);

    return c.json(
      {
        submissionId,
        participantId,
        token: submissionToken,
        submissionAccessToken,
        submissionAccessExpiresAt,
        answerSequence: 0,
        status: 'in_progress',
        testType: session.test_type_code,
        participantResultMode: settings.participantResultMode,
        protectedDelivery: protectedMode,
        totalGroups: protectedMode ? totalGroups : undefined,
        groupSize: protectedMode ? groupSize : undefined,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid request payload' }, 400);
    }
    console.error('[public/session/start] error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
}

const startLimiter = rateLimitByIp({
  windowSeconds: 300,
  maxRequests: 3,
  message: 'Too many test start attempts. Please wait 5 minutes before trying again.',
});

app.post('/session/:token/start', startLimiter, handleStartSession);
app.post('/sessions/:token/start', startLimiter, handleStartSession);

app.get('/submissions/:id/questions', async (c) => {
  const submissionId = Number(c.req.param('id'));
  const accessToken = parseSubmissionToken(c);

  if (!Number.isFinite(submissionId) || submissionId < 1) {
    return c.json({ error: 'Invalid submission id' }, 400);
  }
  if (!accessToken) {
    return c.json({ error: 'Submission access token required' }, 401);
  }

  try {
    const submission = await loadSubmissionForAccess(c.env.DB, submissionId, accessToken);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }
    if (submission.status !== 'in_progress') {
      return c.json({ error: 'Submission is not in progress' }, 409);
    }
    if (submission.session_status !== 'active') {
      return c.json({ error: 'Session is no longer active' }, 403);
    }
    if (submissionIsExpired(submission)) {
      return c.json({ error: 'Submission token expired' }, 401);
    }

    const settings = parseSettings(submission.settings_json);
    const protectedMode = Boolean(submission.protected_delivery_mode) || settings.protectedDeliveryMode;
    const allQuestions = await fetchQuestionsWithOptions(c.env.DB, submission.test_type_id);
    const groupSize = getGroupSizeForTestType(submission.test_type_code, allQuestions.length);
    const computedTotalGroups = computeTotalGroups(allQuestions.length, groupSize);
    const totalGroups = Math.max(1, Number(submission.total_groups ?? computedTotalGroups));
    const currentGroup = protectedMode
      ? clampGroupIndex(Number(submission.current_group ?? 0), totalGroups)
      : 0;
    const isLastGroup = currentGroup >= totalGroups - 1;

    const visibleQuestions = protectedMode
      ? getQuestionSliceForGroup(allQuestions, currentGroup, groupSize)
      : allQuestions;

    const savedAnswers = await loadSavedAnswers(c.env.DB, submission.id);

    return c.json({
      submissionId: submission.id,
      status: 'in_progress',
      answerSequence: submission.answer_sequence,
      groupIndex: currentGroup,
      currentGroup,
      totalGroups: protectedMode ? totalGroups : 1,
      groupSize: protectedMode ? groupSize : allQuestions.length,
      isLastGroup: protectedMode ? isLastGroup : true,
      totalQuestions: allQuestions.length,
      answeredQuestionCount: countAnsweredItems(savedAnswers),
      groupKey: protectedMode ? `group-${currentGroup + 1}` : 'all',
      questions: visibleQuestions,
      savedAnswers,
    });
  } catch (error) {
    console.error('[public/submissions/questions] error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
});

const nextGroupLimiter = rateLimit({
  windowSeconds: 300,
  maxRequests: 30,
  keyFn: (c) => {
    const token = c.req.header('Authorization') ?? c.req.header('X-Submission-Token') ?? c.req.query('token');
    return token ? `next-group:${token}` : 'unknown';
  },
  message: 'Too many section advance attempts. Please wait before trying again.',
});

app.post('/submissions/:id/next-group', nextGroupLimiter, async (c) => {
  const submissionId = Number(c.req.param('id'));
  const accessToken = parseSubmissionToken(c);

  if (!Number.isFinite(submissionId) || submissionId < 1) {
    return c.json({ error: 'Invalid submission id' }, 400);
  }
  if (!accessToken) {
    return c.json({ error: 'Submission access token required' }, 401);
  }

  try {
    const submission = await loadSubmissionForAccess(c.env.DB, submissionId, accessToken);
    if (!submission) return c.json({ error: 'Submission not found' }, 404);
    if (submission.status !== 'in_progress') return c.json({ error: 'Submission is not in progress' }, 409);
    if (submission.session_status !== 'active') return c.json({ error: 'Session is no longer active' }, 403);
    if (submissionIsExpired(submission)) return c.json({ error: 'Submission token expired' }, 401);

    const settings = parseSettings(submission.settings_json);
    const protectedMode = Boolean(submission.protected_delivery_mode) || settings.protectedDeliveryMode;
    if (!protectedMode) {
      return c.json({ error: 'Protected delivery is not enabled for this session' }, 400);
    }

    const allQuestions = await fetchQuestionsWithOptions(c.env.DB, submission.test_type_id);
    const groupSize = getGroupSizeForTestType(submission.test_type_code, allQuestions.length);
    const computedTotalGroups = computeTotalGroups(allQuestions.length, groupSize);
    const totalGroups = Math.max(1, Number(submission.total_groups ?? computedTotalGroups));
    const currentGroup = clampGroupIndex(Number(submission.current_group ?? 0), totalGroups);
    const currentGroupQuestions = getQuestionSliceForGroup(allQuestions, currentGroup, groupSize);
    const currentQuestionIds = currentGroupQuestions.map((question) => question.id);

    if (currentQuestionIds.length > 0) {
      const answeredRow = await queryOne<{ answered: number }>(
        c.env.DB,
        `SELECT COUNT(DISTINCT question_id) AS answered
         FROM answers
         WHERE submission_id = ? AND question_id IN (${makeInClause(currentQuestionIds.length)})`,
        [submission.id, ...currentQuestionIds],
      );
      const answeredCount = Number(answeredRow?.answered ?? 0);
      if (answeredCount < currentQuestionIds.length) {
        return c.json({ error: 'Complete all questions before advancing' }, 400);
      }
    }

    if (currentGroup >= totalGroups - 1) {
      return c.json({
        submissionId: submission.id,
        complete: true,
        currentGroup,
        totalGroups,
        isLastGroup: true,
      });
    }

    const nextGroup = currentGroup + 1;
    await run(
      c.env.DB,
      `UPDATE submissions
       SET current_group = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextGroup, submission.id],
    );

    const nextQuestions = getQuestionSliceForGroup(allQuestions, nextGroup, groupSize);
    const savedAnswers = await loadSavedAnswers(c.env.DB, submission.id);

    return c.json({
      submissionId: submission.id,
      status: 'in_progress',
      answerSequence: submission.answer_sequence,
      groupIndex: nextGroup,
      currentGroup: nextGroup,
      totalGroups,
      groupSize,
      isLastGroup: nextGroup >= totalGroups - 1,
      totalQuestions: allQuestions.length,
      answeredQuestionCount: countAnsweredItems(savedAnswers),
      groupKey: `group-${nextGroup + 1}`,
      questions: nextQuestions,
      savedAnswers,
      complete: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid request payload' }, 400);
    }
    console.error('[public/submissions/next-group] error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
});

app.post('/submissions/:id/answers', rateLimit({
  windowSeconds: 300,
  maxRequests: 60,
  keyFn: (c) => {
    const token = c.req.header('Authorization') ?? c.req.header('X-Submission-Token') ?? c.req.query('token') ?? 'unknown';
    return `sub:${token}`;
  },
  message: 'Too many answer save requests. Please wait before submitting again.',
}), async (c) => {
  const submissionId = Number(c.req.param('id'));
  const accessToken = parseSubmissionToken(c);

  if (!Number.isFinite(submissionId) || submissionId < 1) {
    return c.json({ error: 'Invalid submission id' }, 400);
  }
  if (!accessToken) {
    return c.json({ error: 'Submission access token required' }, 401);
  }

  try {
    const body = await c.req.json();
    const payload = saveAnswersSchema.parse(body);

    const submission = await loadSubmissionForAccess(c.env.DB, submissionId, accessToken);
    if (!submission) return c.json({ error: 'Submission not found' }, 404);
    if (submission.status !== 'in_progress') return c.json({ error: 'Submission is not in progress' }, 409);
    if (submissionIsExpired(submission)) return c.json({ error: 'Submission token expired' }, 401);

    const persistResult = await persistAnswers(
      c.env.DB,
      submission,
      payload.answers as PublicAnswerInput[],
      payload.answerSequence,
    );

    if ('error' in persistResult) {
      return c.json({ error: persistResult.error }, persistResult.status);
    }

    return c.json({
      submissionId: submission.id,
      saved: true,
      answerSequence: persistResult.answerSequence,
      answeredQuestionCount: persistResult.answeredQuestionCount,
      status: 'in_progress',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid request payload' }, 400);
    }
    console.error('[public/submissions/answers] error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
});

app.post('/submissions/:id/submit', rateLimit({
  windowSeconds: 300,
  maxRequests: 3,
  keyFn: (c) => {
    const token = c.req.header('Authorization') ?? c.req.header('X-Submission-Token') ?? c.req.query('token') ?? 'unknown';
    return `submit:${token}`;
  },
  message: 'Too many submit attempts. Please wait before trying again.',
}), async (c) => {
  const submissionId = Number(c.req.param('id'));
  const accessToken = parseSubmissionToken(c);

  if (!Number.isFinite(submissionId) || submissionId < 1) {
    return c.json({ error: 'Invalid submission id' }, 400);
  }
  if (!accessToken) {
    return c.json({ error: 'Submission access token required' }, 401);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const payload = submitSchema.parse(body);

    const submission = await loadSubmissionForAccess(c.env.DB, submissionId, accessToken);
    if (!submission) return c.json({ error: 'Submission not found' }, 404);
    if (submissionIsExpired(submission)) return c.json({ error: 'Submission token expired' }, 401);

    const existingResult = await loadResultDetailForSubmission(c.env.DB, submission.id);
    if (existingResult) {
      return c.json({
        submissionId: submission.id,
        participantId: existingResult.participantId,
        status: 'scored',
        resultId: existingResult.id,
        result: existingResult,
      });
    }

    if (submission.status !== 'in_progress' && submission.status !== 'submitted') {
      return c.json({ error: 'Submission is not in a submittable state' }, 409);
    }

    if (payload.answers && payload.answers.length > 0) {
      const nextSequence = payload.answerSequence ?? submission.answer_sequence + 1;
      const persistResult = await persistAnswers(
        c.env.DB,
        submission,
        payload.answers as PublicAnswerInput[],
        nextSequence,
      );
      if ('error' in persistResult) {
        return c.json({ error: persistResult.error }, persistResult.status);
      }
      submission.answer_sequence = persistResult.answerSequence;
    }

    const savedAnswers = await loadSavedAnswers(c.env.DB, submission.id);
    if (savedAnswers.length === 0) {
      return c.json({ error: 'No answers found for submission' }, 400);
    }

    const scoredQuestions = await buildScoredQuestions(c.env.DB, submission.test_type_id, submission.test_type_code);
    const submissionAnswers = toSubmissionAnswers(savedAnswers);

    const testTypeCode = submission.test_type_code.toLowerCase();
    if (testTypeCode !== 'iq' && testTypeCode !== 'disc' && testTypeCode !== 'workload') {
      return c.json({ error: `Unsupported test type for scoring: ${submission.test_type_code}` }, 400);
    }

    const scoringResult = createScoringResult(testTypeCode, scoredQuestions, submissionAnswers);
    const settings = parseSettings(submission.settings_json);

    let scoreTotal: number | null = null;
    let scoreBand: string | null = null;
    let primaryType: string | null = null;
    let secondaryType: string | null = null;
    let profileCode: string | null = null;
    let interpretationKey: string | null = null;

    if (scoringResult.iqResult) {
      scoreTotal = scoringResult.iqResult.totalScore;
      scoreBand = scoringResult.iqResult.band;
      interpretationKey = scoringResult.iqResult.band;
    } else if (scoringResult.discResult) {
      primaryType = scoringResult.discResult.primaryType;
      secondaryType = scoringResult.discResult.secondaryType;
      profileCode = scoringResult.discResult.profilePattern;
      interpretationKey = 'disc_profile';
    } else if (scoringResult.workloadResult) {
      scoreTotal = Math.round(scoringResult.workloadResult.overallScore * 10);
      scoreBand = scoringResult.workloadResult.band;
      interpretationKey = scoringResult.workloadResult.band;
    }

    const resultPayload = {
      ...scoringResult,
      submittedAt: new Date().toISOString(),
      participantResultMode: settings.participantResultMode,
    };

    await run(
      c.env.DB,
      `UPDATE submissions
       SET status = 'submitted', submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [submission.id],
    );

    const resultInsert = await run(
      c.env.DB,
      `INSERT INTO results (
        submission_id,
        participant_id,
        test_type_id,
        test_type,
        score_total,
        score_band,
        primary_type,
        secondary_type,
        profile_code,
        interpretation_key,
        review_status,
        distribution_policy,
        participant_result_access,
        hr_result_access,
        protected_delivery_mode,
        result_payload_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scored_preliminary', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        submission.id,
        submission.participant_id,
        submission.test_type_id,
        submission.test_type_code,
        scoreTotal,
        scoreBand,
        primaryType,
        secondaryType,
        profileCode,
        interpretationKey,
        settings.distributionPolicy,
        settings.participantResultAccess,
        settings.hrResultAccess,
        settings.protectedDeliveryMode ? 1 : 0,
        JSON.stringify(resultPayload),
      ],
    );

    const resultId = Number(resultInsert.meta.last_row_id);

    if (scoringResult.iqResult) {
      let sortOrder = 1;
      for (const [key, value] of Object.entries(scoringResult.iqResult.dimensions)) {
        await run(
          c.env.DB,
          `INSERT INTO result_summaries
            (result_id, metric_key, metric_label, metric_type, score, band, sort_order, created_at)
           VALUES (?, ?, ?, 'dimension', ?, ?, ?, CURRENT_TIMESTAMP)`,
          [resultId, key, key.charAt(0).toUpperCase() + key.slice(1), value.percentage, null, sortOrder++],
        );
      }
    } else if (scoringResult.discResult) {
      const dimensions: Array<'D' | 'I' | 'S' | 'C'> = ['D', 'I', 'S', 'C'];
      for (let index = 0; index < dimensions.length; index += 1) {
        const key = dimensions[index];
        await run(
          c.env.DB,
          `INSERT INTO result_summaries
            (result_id, metric_key, metric_label, metric_type, score, band, sort_order, created_at)
           VALUES (?, ?, ?, 'dimension', ?, NULL, ?, CURRENT_TIMESTAMP)`,
          [resultId, key.toLowerCase(), key, scoringResult.discResult.scores[key], index + 1],
        );
      }
    } else if (scoringResult.workloadResult) {
      const labels: Record<string, string> = {
        mental_demand: 'Mental Demand',
        physical_demand: 'Physical Demand',
        temporal_demand: 'Temporal Demand',
        performance: 'Performance',
        effort: 'Effort',
        frustration: 'Frustration',
      };
      let sortOrder = 1;
      for (const [key, value] of Object.entries(scoringResult.workloadResult.dimensions)) {
        await run(
          c.env.DB,
          `INSERT INTO result_summaries
            (result_id, metric_key, metric_label, metric_type, score, band, sort_order, created_at)
           VALUES (?, ?, ?, 'dimension', ?, NULL, ?, CURRENT_TIMESTAMP)`,
          [resultId, key, labels[key] ?? key, value, sortOrder++],
        );
      }
    }

    await run(
      c.env.DB,
      "UPDATE submissions SET status = 'scored', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [submission.id],
    );

    const resultDetail = await loadResultDetailForSubmission(c.env.DB, submission.id);
    if (!resultDetail) {
      return c.json({ error: 'Result was created but could not be loaded' }, 500);
    }

    return c.json({
      submissionId: submission.id,
      participantId: submission.participant_id,
      status: 'scored',
      resultId,
      result: resultDetail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid request payload' }, 400);
    }
    console.error('[public/submissions/submit] error', error);
    return c.json({ error: 'Internal Server Error', message: String(error) }, 500);
  }
});

export default app;
