import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

type ResultReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';

function normalizeReviewStatus(rawStatus: string | null, releasedAt: string | null): ResultReviewStatus {
  if (releasedAt) return 'released';
  if (rawStatus === 'released') return 'released';
  if (rawStatus === 'reviewed') return 'reviewed';
  if (rawStatus === 'in_review') return 'in_review';
  return 'scored_preliminary';
}

function parseJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const listQuerySchema = z.object({
  search: z.string().optional(),
  testType: z.enum(['iq', 'disc', 'workload', 'custom', 'all']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reviewStatus: z.enum(['scored_preliminary', 'in_review', 'reviewed', 'released', 'all']).optional(),
});

app.use('*', requireAdmin);

app.get('/', async (c) => {
  const filters = listQuerySchema.parse(c.req.query());

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(p.full_name LIKE ? OR p.email LIKE ? OR ts.title LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.testType && filters.testType !== 'all') {
    conditions.push('r.test_type = ?');
    params.push(filters.testType);
  }

  if (filters.dateFrom) {
    conditions.push('s.submitted_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push('s.submitted_at <= ?');
    params.push(filters.dateTo);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    c.env.DB,
    `SELECT
      r.id,
      r.submission_id,
      r.participant_id,
      r.test_type,
      r.score_total,
      r.score_band,
      r.primary_type,
      r.profile_code,
      r.review_status,
      r.released_at,
      r.distribution_policy,
      r.participant_result_access,
      r.hr_result_access,
      r.protected_delivery_mode,
      r.result_payload_json,
      p.full_name AS participant_name,
      p.email AS participant_email,
      p.department,
      p.position_title,
      s.session_id as test_session_id,
      ts.title AS session_title,
      ts.access_token,
      s.submitted_at
    FROM results r
    INNER JOIN submissions s ON s.id = r.submission_id
    INNER JOIN participants p ON p.id = s.participant_id
    INNER JOIN test_sessions ts ON ts.id = s.session_id
    ${where}
    ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
    LIMIT 100`,
    params,
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const payload = parseJson(String(row.result_payload_json ?? '{}'));
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
      testType: row.test_type as string,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      scoreTotal: row.score_total != null ? Number(row.score_total) : null,
      scoreBand: row.score_band ? String(row.score_band) : null,
      primaryType: row.primary_type ? String(row.primary_type) : null,
      profileCode: row.profile_code ? String(row.profile_code) : null,
      reviewStatus: normalizeReviewStatus(row.review_status as string | null, row.released_at as string | null),
      distributionPolicy: (row.distribution_policy ?? 'participant_summary') as string,
      participantResultAccess: (row.participant_result_access ?? 'summary') as string,
      hrResultAccess: (row.hr_result_access ?? 'full') as string,
      protectedDeliveryMode: Boolean(row.protected_delivery_mode),
      resultPayload: payload || {},
    };
  });

  if (filters.reviewStatus && filters.reviewStatus !== 'all') {
    const filtered = items.filter((item) => item.reviewStatus === filters.reviewStatus);
    return c.json({ items: filtered });
  }

  return c.json({ items });
});

app.get('/reviewer-queue/summary', async (c) => {
  const db = c.env.DB;

  const [totalResult, scoredResult, inReviewResult, reviewedResult] = await Promise.all([
    queryOne<{ value: number }>(db, 'SELECT COUNT(*) AS value FROM results'),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM results WHERE review_status = 'scored_preliminary' OR review_status IS NULL"),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM results WHERE review_status = 'in_review'"),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM results WHERE review_status = 'reviewed' AND released_at IS NULL"),
  ]);

  return c.json({
    pendingCount: Number(scoredResult?.value ?? 0),
    unassignedCount: Number(scoredResult?.value ?? 0),
    assignedToMeCount: 0,
    inReviewCount: Number(inReviewResult?.value ?? 0),
    readyForReleaseCount: Number(reviewedResult?.value ?? 0),
  });
});

app.get('/reviewer-queue', async (c) => {
  const scope = c.req.query('scope') || 'all';
  const adminId = c.get('adminPayload').adminId;

  let whereClause = "WHERE r.review_status IN ('scored_preliminary', 'in_review', 'reviewed')";
  const params: unknown[] = [];

  if (scope === 'mine') {
    whereClause += ' AND r.reviewer_admin_id = ?';
    params.push(adminId);
  } else if (scope === 'unassigned') {
    whereClause += ' AND r.reviewer_admin_id IS NULL';
  }

  const rows = await query(
    c.env.DB,
    `SELECT
      r.id,
      r.submission_id,
      r.participant_id,
      r.test_type,
      r.score_total,
      r.score_band,
      r.profile_code,
      r.review_status,
      r.reviewer_admin_id,
      r.released_at,
      p.full_name AS participant_name,
      p.email AS participant_email,
      ts.title AS session_title,
      s.submitted_at
    FROM results r
    INNER JOIN submissions s ON s.id = r.submission_id
    INNER JOIN participants p ON p.id = s.participant_id
    INNER JOIN test_sessions ts ON ts.id = s.session_id
    ${whereClause}
    ORDER BY COALESCE(s.submitted_at, r.created_at) DESC
    LIMIT 50`,
    params,
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      submissionId: Number(row.submission_id),
      participantId: Number(row.participant_id),
      participantName: String(row.participant_name ?? ''),
      participantEmail: String(row.participant_email ?? ''),
      sessionTitle: String(row.session_title ?? ''),
      testType: row.test_type as string,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      scoreTotal: row.score_total != null ? Number(row.score_total) : null,
      scoreBand: row.score_band ? String(row.score_band) : null,
      profileCode: row.profile_code ? String(row.profile_code) : null,
      reviewStatus: normalizeReviewStatus(row.review_status as string | null, row.released_at as string | null),
      reviewerAdminId: row.reviewer_admin_id ? Number(row.reviewer_admin_id) : null,
    };
  });

  return c.json({ items });
});

app.get('/reviewers', async (c) => {
  const rows = await query(
    c.env.DB,
    "SELECT id, full_name, email, role FROM admins WHERE role IN ('super_admin', 'psychologist_reviewer') ORDER BY full_name",
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      fullName: String(row.full_name),
      email: String(row.email),
      role: row.role as 'super_admin' | 'psychologist_reviewer',
    };
  });

  return c.json({ items });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid result id' }, 400);
  }

  const row = await queryOne<Record<string, unknown>>(
    c.env.DB,
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
      s.session_id as test_session_id,
      ts.title AS session_title,
      ts.access_token,
      s.submitted_at
    FROM results r
    INNER JOIN submissions s ON s.id = r.submission_id
    INNER JOIN participants p ON p.id = s.participant_id
    INNER JOIN test_sessions ts ON ts.id = s.session_id
    WHERE r.id = ?
    LIMIT 1`,
    [id],
  );

  if (!row) {
    return c.json({ error: 'Result not found' }, 404);
  }

  const payload = parseJson(String(row.result_payload_json ?? '{}'));

  return c.json({
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
    testType: row.test_type as string,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    scoreTotal: row.score_total != null ? Number(row.score_total) : null,
    scoreBand: row.score_band ? String(row.score_band) : null,
    primaryType: row.primary_type ? String(row.primary_type) : null,
    secondaryType: row.secondary_type ? String(row.secondary_type) : null,
    profileCode: row.profile_code ? String(row.profile_code) : null,
    interpretationKey: row.interpretation_key ? String(row.interpretation_key) : null,
    reviewStatus: normalizeReviewStatus(row.review_status as string | null, row.released_at as string | null),
    reviewStartedAt: row.review_started_at ? String(row.review_started_at) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewerAdminId: row.reviewer_admin_id ? Number(row.reviewer_admin_id) : null,
    releasedAt: row.released_at ? String(row.released_at) : null,
    releasedByAdminId: row.released_by_admin_id ? Number(row.released_by_admin_id) : null,
    professionalSummary: row.professional_summary ? String(row.professional_summary) : null,
    recommendation: row.recommendation ? String(row.recommendation) : null,
    limitations: row.limitations ? String(row.limitations) : null,
    reviewerNotes: row.reviewer_notes ? String(row.reviewer_notes) : null,
    distributionPolicy: (row.distribution_policy ?? 'participant_summary') as string,
    participantResultAccess: (row.participant_result_access ?? 'summary') as string,
    hrResultAccess: (row.hr_result_access ?? 'full') as string,
    protectedDeliveryMode: Boolean(row.protected_delivery_mode),
    resultPayload: payload || {},
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
      testType: row.test_type as string,
    },
  });
});

const updateReviewSchema = z.object({
  reviewStatus: z.enum(['scored_preliminary', 'in_review', 'reviewed', 'released']).optional(),
  professionalSummary: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  limitations: z.string().nullable().optional(),
  reviewerNotes: z.string().nullable().optional(),
});

app.patch('/:id/review', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid result id' }, 400);
  }

  const payload = c.get('adminPayload');
  const body = await c.req.json();
  const updates = updateReviewSchema.parse(body);

  const existing = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM results WHERE id = ? LIMIT 1',
    [id],
  );

  if (!existing) {
    return c.json({ error: 'Result not found' }, 404);
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.reviewStatus !== undefined) {
    setClauses.push('review_status = ?');
    params.push(updates.reviewStatus);
  }
  if (updates.professionalSummary !== undefined) {
    setClauses.push('professional_summary = ?');
    params.push(updates.professionalSummary);
  }
  if (updates.recommendation !== undefined) {
    setClauses.push('recommendation = ?');
    params.push(updates.recommendation);
  }
  if (updates.limitations !== undefined) {
    setClauses.push('limitations = ?');
    params.push(updates.limitations);
  }
  if (updates.reviewerNotes !== undefined) {
    setClauses.push('reviewer_notes = ?');
    params.push(updates.reviewerNotes);
  }

  if (setClauses.length > 0) {
    params.push(id);
    await run(c.env.DB, `UPDATE results SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
  }

  await run(
    c.env.DB,
    `INSERT INTO audit_events (actor_type, actor_admin_id, entity_type, entity_id, action, metadata_json, created_at)
     VALUES ('admin', ?, 'result', ?, 'result.review_updated', ?, CURRENT_TIMESTAMP)`,
    [payload.adminId, id, JSON.stringify({ reviewStatus: updates.reviewStatus })],
  );

  const row = await queryOne<Record<string, unknown>>(
    c.env.DB,
    `SELECT
      r.id, r.review_status, r.professional_summary, r.recommendation, r.limitations, r.reviewer_notes, r.released_at
    FROM results r
    WHERE r.id = ?
    LIMIT 1`,
    [id],
  );

  if (!row) {
    return c.json({ error: 'Result not found after update' }, 500);
  }

  return c.json({
    id: Number(row.id),
    reviewStatus: normalizeReviewStatus(row.review_status as string | null, row.released_at as string | null),
    professionalSummary: row.professional_summary ? String(row.professional_summary) : null,
    recommendation: row.recommendation ? String(row.recommendation) : null,
    limitations: row.limitations ? String(row.limitations) : null,
    reviewerNotes: row.reviewer_notes ? String(row.reviewer_notes) : null,
  });
});

app.patch('/:id/assign-reviewer', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid result id' }, 400);
  }

  const payload = c.get('adminPayload');
  const body = await c.req.json();
  const reviewerAdminId = body.reviewerAdminId as number | null;

  const existing = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM results WHERE id = ? LIMIT 1',
    [id],
  );

  if (!existing) {
    return c.json({ error: 'Result not found' }, 404);
  }

  await run(
    c.env.DB,
    'UPDATE results SET reviewer_admin_id = ?, review_status = COALESCE(review_status, \'in_review\'), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [reviewerAdminId, id],
  );

  await run(
    c.env.DB,
    `INSERT INTO audit_events (actor_type, actor_admin_id, entity_type, entity_id, action, metadata_json, created_at)
     VALUES ('admin', ?, 'result', ?, 'result.assigned', ?, CURRENT_TIMESTAMP)`,
    [payload.adminId, id, JSON.stringify({ reviewerAdminId })],
  );

  return c.json({ id, reviewerAdminId });
});

export default app;