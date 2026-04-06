import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

type TestSessionStatus = 'draft' | 'active' | 'completed' | 'archived';
type TestType = 'iq' | 'disc' | 'workload';

interface SessionRow {
  id: number;
  title: string;
  description: string | null;
  test_type: TestType;
  status: TestSessionStatus;
  access_token: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  settings_json: string | null;
  starts_at: string | null;
  ends_at: string | null;
  participant_count: number;
  completed_count: number;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(200),
  testType: z.enum(['iq', 'disc', 'workload']),
  description: z.string().optional(),
  instructions: z.string().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  timeLimitMinutes: z.number().int().positive().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
  settings: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  timeLimitMinutes: z.number().int().positive().nullable().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  settings: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  testType: z.enum(['iq', 'disc', 'workload']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'session';
}

function createAccessToken(testType: string, title: string): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${testType}-${slugify(title)}-${randomHex}`.slice(0, 80);
}

function parseInstructions(instructions: string | null): string[] {
  return (instructions ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function getDefaultSettings() {
  return {
    assessmentPurpose: 'recruitment' as const,
    administrationMode: 'remote_unsupervised' as const,
    interpretationMode: 'professional_review' as const,
    participantLimit: null as number | null,
    contactPerson: 'HR Assessment Desk',
    consentStatement: 'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
    privacyStatement: 'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
    distributionPolicy: 'participant_summary' as const,
    protectedDeliveryMode: false,
    participantResultAccess: 'summary' as const,
    hrResultAccess: 'full' as const,
  };
}

function parseSettings(settingsJson: string | null) {
  const defaults = getDefaultSettings();
  if (!settingsJson) return defaults;

  try {
    const parsed = JSON.parse(settingsJson);
    return {
      assessmentPurpose: parsed.assessmentPurpose ?? defaults.assessmentPurpose,
      administrationMode: parsed.administrationMode ?? defaults.administrationMode,
      interpretationMode: parsed.interpretationMode ?? defaults.interpretationMode,
      participantLimit: parsed.participantLimit ?? null,
      contactPerson: parsed.contactPerson ?? defaults.contactPerson,
      consentStatement: parsed.consentStatement ?? defaults.consentStatement,
      privacyStatement: parsed.privacyStatement ?? defaults.privacyStatement,
      distributionPolicy: parsed.distributionPolicy ?? defaults.distributionPolicy,
      protectedDeliveryMode: parsed.protectedDeliveryMode ?? false,
      participantResultAccess: parsed.participantResultAccess ?? defaults.participantResultAccess,
      hrResultAccess: parsed.hrResultAccess ?? defaults.hrResultAccess,
    };
  } catch {
    return defaults;
  }
}

function mapSession(row: SessionRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    testType: row.test_type,
    status: row.status,
    accessToken: row.access_token,
    participantCount: Number(row.participant_count ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    timeLimitMinutes: row.time_limit_minutes ?? null,
    settings: parseSettings(row.settings_json),
  };
}

const SESSION_SELECT = `
  SELECT
    ts.id,
    ts.title,
    ts.description,
    ts.test_type,
    ts.status,
    ts.access_token,
    ts.instructions,
    ts.time_limit_minutes,
    ts.settings_json,
    ts.starts_at,
    ts.ends_at,
    COUNT(DISTINCT s.participant_id) AS participant_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('submitted','scored') THEN s.participant_id END) AS completed_count
  FROM test_sessions ts
  LEFT JOIN submissions s ON s.session_id = ts.id
`;

const SESSION_GROUP_BY = `
  GROUP BY ts.id, ts.title, ts.description, ts.test_type, ts.status,
           ts.access_token, ts.instructions, ts.time_limit_minutes,
           ts.settings_json, ts.starts_at, ts.ends_at, ts.updated_at
`;

// ─── Router ──────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

app.use('*', requireAdmin);

// GET /api/sessions
app.get('/', async (c) => {
  const filters = listQuerySchema.parse(c.req.query());

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(ts.title LIKE ? OR COALESCE(ts.description, \'\') LIKE ? OR ts.access_token LIKE ?)');
    params.push(like, like, like);
  }
  if (filters.testType) {
    conditions.push('ts.test_type = ?');
    params.push(filters.testType);
  }
  if (filters.status) {
    conditions.push('ts.status = ?');
    params.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? `LIMIT ${filters.limit}` : 'LIMIT 50';

  const rows = await query(
    c.env.DB,
    `${SESSION_SELECT} ${where} ${SESSION_GROUP_BY} ORDER BY ts.updated_at DESC, ts.id DESC ${limit}`,
    params,
  );

  const items = (rows.results ?? []).map((r) => mapSession(r as SessionRow));
  return c.json({ items });
});

// GET /api/sessions/:id
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid session id' }, 400);
  }

  const row = await queryOne<SessionRow>(
    c.env.DB,
    `${SESSION_SELECT} WHERE ts.id = ? ${SESSION_GROUP_BY} LIMIT 1`,
    [id],
  );

  if (!row) return c.json({ error: 'Session not found' }, 404);

  // Fetch participants
  const participantRows = await query(
    c.env.DB,
    `SELECT
       s.id AS submission_id,
       p.id AS participant_id,
       p.full_name,
       p.email,
       p.employee_code,
       p.department,
       p.position_title,
       s.attempt_no,
       s.status,
       s.started_at,
       s.submitted_at,
       r.id AS result_id,
       r.score_total,
       r.score_band,
       r.profile_code,
       r.result_payload_json
     FROM submissions s
     INNER JOIN participants p ON p.id = s.participant_id
     LEFT JOIN results r ON r.submission_id = s.id
     WHERE s.session_id = ?
     ORDER BY COALESCE(s.submitted_at, s.started_at, s.created_at) DESC, s.id DESC`,
    [id],
  );

  const summary = mapSession(row);
  const participantCount = summary.participantCount;

  const participants = (participantRows.results ?? []).map((r) => {
    const p = r as Record<string, unknown>;
    return {
      submissionId: p.submission_id as number,
      participantId: p.participant_id as number,
      fullName: p.full_name as string,
      email: p.email as string,
      employeeCode: (p.employee_code as string | null) ?? null,
      department: (p.department as string | null) ?? null,
      positionTitle: (p.position_title as string | null) ?? null,
      attemptNo: (p.attempt_no as number) ?? 1,
      status: p.status as string,
      startedAt: (p.started_at as string | null) ?? null,
      submittedAt: (p.submitted_at as string | null) ?? null,
      resultId: (p.result_id as number | null) ?? null,
      scoreTotal: (p.score_total as number | null) ?? null,
      scoreBand: (p.score_band as string | null) ?? null,
      profileCode: (p.profile_code as string | null) ?? null,
    };
  });

  return c.json({
    ...summary,
    instructions: parseInstructions(row.instructions),
    completionRate: participantCount === 0
      ? 0
      : Math.round((summary.completedCount / participantCount) * 100),
    participants,
  });
});

// POST /api/sessions
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const data = createSchema.parse(body);
    const payload = c.get('adminPayload');

    const accessToken = createAccessToken(data.testType, data.title);
    const result = await run(
      c.env.DB,
      `INSERT INTO test_sessions
         (title, description, test_type, status, access_token, instructions,
          settings_json, time_limit_minutes, starts_at, ends_at, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title.trim(),
        data.description?.trim() || null,
        data.testType,
        data.status,
        accessToken,
        data.instructions?.trim() || null,
        data.settings ? JSON.stringify(data.settings) : null,
        data.timeLimitMinutes ?? null,
        data.startsAt ?? null,
        data.endsAt ?? null,
        payload.adminId,
      ],
    );

    const newId = result.meta.last_row_id as number;
    const row = await queryOne<SessionRow>(
      c.env.DB,
      `${SESSION_SELECT} WHERE ts.id = ? ${SESSION_GROUP_BY} LIMIT 1`,
      [newId],
    );

    if (!row) return c.json({ error: 'Failed to create session' }, 500);

    return c.json({ ...mapSession(row), instructions: parseInstructions(row.instructions) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// PATCH /api/sessions/:id
app.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid session id' }, 400);
  }

  try {
    const body = await c.req.json();
    const data = updateSchema.parse(body);

    const existing = await queryOne<{ id: number }>(
      c.env.DB,
      'SELECT id FROM test_sessions WHERE id = ? LIMIT 1',
      [id],
    );
    if (!existing) return c.json({ error: 'Session not found' }, 404);

    await run(
      c.env.DB,
      `UPDATE test_sessions
       SET title = ?, description = ?, instructions = ?, settings_json = ?,
           time_limit_minutes = ?, status = ?, starts_at = ?, ends_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.title.trim(),
        data.description?.trim() || null,
        data.instructions?.trim() || null,
        data.settings ? JSON.stringify(data.settings) : null,
        data.timeLimitMinutes ?? null,
        data.status,
        data.startsAt ?? null,
        data.endsAt ?? null,
        id,
      ],
    );

    const row = await queryOne<SessionRow>(
      c.env.DB,
      `${SESSION_SELECT} WHERE ts.id = ? ${SESSION_GROUP_BY} LIMIT 1`,
      [id],
    );

    if (!row) return c.json({ error: 'Session not found after update' }, 500);

    return c.json({ ...mapSession(row), instructions: parseInstructions(row.instructions) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// DELETE /api/sessions/:id  (archive only)
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid session id' }, 400);
  }

  const existing = await queryOne<{ id: number; status: string }>(
    c.env.DB,
    'SELECT id, status FROM test_sessions WHERE id = ? LIMIT 1',
    [id],
  );

  if (!existing) return c.json({ error: 'Session not found' }, 404);

  await run(
    c.env.DB,
    "UPDATE test_sessions SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );

  return c.json({ id, status: 'archived' });
});

export default app;
