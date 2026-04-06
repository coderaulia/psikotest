import { Hono } from 'hono';
import type { Env } from '../index';
import { verifyAdminToken } from './admin-middleware';

const app = new Hono<{ Bindings: Env }>();

// Helper function to get results query with joins
async function getResultsQuery(db: D1Database, filters: {
  search?: string;
  testType?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: string;
  reviewerId?: string;
  reviewStatus?: string;
}) {
  let query = `
    SELECT r.id, r.submission_id, r.test_type_id, tt.code as test_type_code, tt.name as test_type_name,
           r.primary_type, r.secondary_type, r.profile_code, r.score_total, r.score_band,
           r.interpretation_key, r.result_payload_json, r.created_at, r.updated_at,
           p.full_name as participant_name, p.email as participant_email, p.employee_code,
           s.status as submission_status, s.submitted_at, s.time_spent_seconds,
           ca.full_name as assigned_reviewer_name
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    LEFT JOIN admins ca ON r.interpretation_key = ca.id
  `;
  
  const conditions: string[] = [];
  const params: string[] = [];
  
  if (filters.search) {
    conditions.push(`(p.full_name LIKE ? OR p.email LIKE ? OR p.employee_code LIKE ?)`);
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  if (filters.testType) {
    conditions.push(`tt.code = ?`);
    params.push(filters.testType);
  }
  if (filters.dateFrom) {
    conditions.push(`r.created_at >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`r.created_at <= ?`);
    params.push(filters.dateTo);
  }
  if (filters.reviewStatus && filters.reviewStatus !== 'all') {
    conditions.push(`r.interpretation_key ${filters.reviewStatus === 'unassigned' ? 'IS NULL' : 'IS NOT NULL'}`);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ` ORDER BY r.created_at DESC LIMIT 100`;
  
  const stmt = db.prepare(query);
  return params.length > 0 ? stmt.bind(...params) : stmt;
}

// List all results
app.get('/', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const search = c.req.query('search') || '';
  const testType = c.req.query('testType') || '';
  const dateFrom = c.req.query('dateFrom') || '';
  const dateTo = c.req.query('dateTo') || '';
  const reviewStatus = c.req.query('reviewStatus') || '';
  
  const stmt = await getResultsQuery(db, { search, testType, dateFrom, dateTo, reviewStatus });
  const result = await stmt.all();
  
  return c.json({ items: result.results || [] });
});

// Get reviewer queue
app.get('/reviewer-queue', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const scope = c.req.query('scope') || 'all';
  
  let query = `
    SELECT r.id, r.submission_id, r.test_type_id, tt.code as test_type_code, tt.name as test_type_name,
           r.primary_type, r.secondary_type, r.profile_code, r.score_total, r.score_band,
           r.created_at, r.updated_at,
           p.full_name as participant_name, p.email as participant_email,
           s.submitted_at, s.time_spent_seconds
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    WHERE r.interpretation_key IS NULL OR r.interpretation_key = ''
  `;
  
  const params: string[] = [];
  
  if (scope === 'mine') {
    query += ` AND r.interpretation_key = ?`;
    params.push(admin.id);
  }
  
  query += ` ORDER BY r.created_at DESC LIMIT 100`;
  
  const stmt = db.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  
  return c.json({ items: result.results || [] });
});

// Get reviewer queue summary
app.get('/reviewer-queue/summary', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  const [pendingResult, inProgressResult, completedResult] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM results WHERE interpretation_key IS NULL OR interpretation_key = ''`).first(),
    db.prepare(`SELECT COUNT(*) as count FROM results WHERE interpretation_key IS NOT NULL AND interpretation_key != '' AND updated_at > created_at`).first(),
    db.prepare(`SELECT COUNT(*) as count FROM results WHERE interpretation_key IS NOT NULL AND interpretation_key != ''`).first(),
  ]);
  
  return c.json({ 
    pending: (pendingResult as any)?.count || 0, 
    inProgress: (inProgressResult as any)?.count || 0, 
    completed: (completedResult as any)?.count || 0 
  });
});

// Get list of reviewers (admins)
app.get('/reviewers', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const reviewers = await db.prepare(
    'SELECT id, full_name, email, role FROM admins WHERE status = ? ORDER BY full_name'
  ).bind('active').all();
  
  return c.json({ items: reviewers.results || [] });
});

// Get result detail
app.get('/:id', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare(`
    SELECT r.*, tt.code as test_type_code, tt.name as test_type_name,
           p.full_name as participant_name, p.email as participant_email, 
           p.employee_code, p.department, p.position_title,
           s.submitted_at, s.time_spent_seconds, s.identity_snapshot_json,
           a.full_name as assigned_reviewer_name
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    LEFT JOIN admins a ON r.interpretation_key = CAST(a.id AS TEXT)
    WHERE r.id = ?
  `).bind(id).first();
  
  if (!result) {
    return c.json({ error: 'Result not found' }, 404);
  }
  
  // Get result summaries
  const summaries = await db.prepare(`
    SELECT id, metric_key, metric_label, metric_type, score, band, sort_order, summary_text, chart_payload_json
    FROM result_summaries
    WHERE result_id = ?
    ORDER BY sort_order
  `).bind(id).all();
  
  return c.json({
    ...result,
    summaries: summaries.results || [],
  });
});

// Update result review status
app.patch('/:id/review-status', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Result not found' }, 404);
  }
  
  // Update interpretation_key as review status indicator
  let interpretationKey = (existing as any).interpretation_key;
  if (body.reviewStatus === 'scored_preliminary') {
    interpretationKey = null;
  } else if (body.reviewStatus === 'in_review') {
    interpretationKey = admin.id;
  } else if (body.reviewStatus === 'reviewed') {
    interpretationKey = admin.id;
  }
  
  await db.prepare(`
    UPDATE results 
    SET interpretation_key = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(interpretationKey, id).run();
  
  const updated = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  return c.json(updated);
});

// Update result review details
app.patch('/:id/review', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Result not found' }, 404);
  }
  
  // Parse existing payload or create new
  let payload: any = {};
  try {
    payload = JSON.parse((existing as any).result_payload_json || '{}');
  } catch {
    payload = {};
  }
  
  // Update review fields
  if (body.professionalSummary !== undefined) {
    payload.professionalSummary = body.professionalSummary;
  }
  if (body.recommendation !== undefined) {
    payload.recommendation = body.recommendation;
  }
  if (body.limitations !== undefined) {
    payload.limitations = body.limitations;
  }
  if (body.reviewerNotes !== undefined) {
    payload.reviewerNotes = body.reviewerNotes;
  }
  if (body.reviewStatus !== undefined) {
    payload.reviewStatus = body.reviewStatus;
  }
  
  await db.prepare(`
    UPDATE results 
    SET result_payload_json = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(JSON.stringify(payload), id).run();
  
  const updated = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  return c.json(updated);
});

// Assign reviewer to result
app.patch('/:id/assign-reviewer', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Result not found' }, 404);
  }
  
  const reviewerId = body.reviewerAdminId ? String(body.reviewerAdminId) : null;
  
  await db.prepare(`
    UPDATE results 
    SET interpretation_key = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(reviewerId, id).run();
  
  const updated = await db.prepare('SELECT * FROM results WHERE id = ?').bind(id).first();
  return c.json(updated);
});

export default app;
