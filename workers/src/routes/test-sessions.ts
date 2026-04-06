import { Hono } from 'hono';
import type { Env } from '../index';
import { verifyAdminToken } from './admin-middleware';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const search = c.req.query('search') || '';
  const status = c.req.query('status') || '';
  const testType = c.req.query('testType') || '';
  
  let query = `SELECT ts.id, ts.test_type_id, tt.name as test_type_name, tt.code as test_type_code, ts.title, ts.status, ts.access_token, ts.created_at, ts.starts_at, ts.ends_at, a.full_name as created_by_name FROM test_sessions ts LEFT JOIN test_types tt ON ts.test_type_id = tt.id LEFT JOIN admins a ON ts.created_by_admin_id = a.id`;
  const conditions: string[] = [];
  const params: string[] = [];
  
  if (search) {
    conditions.push(`(ts.title LIKE ? OR ts.access_token LIKE ?)`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  if (status) {
    conditions.push(`ts.status = ?`);
    params.push(status);
  }
  if (testType) {
    conditions.push(`tt.code = ?`);
    params.push(testType);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ` ORDER BY ts.created_at DESC LIMIT 100`;
  
  const stmt = db.prepare(query);
  const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await boundStmt.all();
  
  return c.json({ items: result.results || [] });
});

app.get('/:id', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const session = await db.prepare(`
    SELECT ts.id, ts.test_type_id, tt.code as test_type_code, tt.name as test_type_name, ts.title, ts.description, ts.access_token, ts.instructions, ts.settings_json, ts.status, ts.time_limit_minutes, ts.starts_at, ts.ends_at, ts.created_at, a.full_name as created_by_name
    FROM test_sessions ts
    LEFT JOIN test_types tt ON ts.test_type_id = tt.id
    LEFT JOIN admins a ON ts.created_by_admin_id = a.id
    WHERE ts.id = ?
  `).bind(id).first();
  
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  
  return c.json(session);
});

app.post('/', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  const accessToken = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  const result = await db.prepare(`
    INSERT INTO test_sessions (test_type_id, title, description, access_token, instructions, settings_json, status, time_limit_minutes, created_by_admin_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, datetime('now'), datetime('now'))
  `).bind(
    body.testTypeId || 1,
    body.title || 'New Session',
    body.description || '',
    accessToken,
    body.instructions || '',
    body.settings ? JSON.stringify(body.settings) : null,
    body.timeLimitMinutes || null,
    admin.id
  ).run();
  
  const newId = result.meta.last_row_id;
  const newSession = await db.prepare('SELECT * FROM test_sessions WHERE id = ?').bind(newId).first();
  
  return c.json(newSession);
});

app.patch('/:id', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM test_sessions WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Session not found' }, 404);
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.instructions !== undefined) { updates.push('instructions = ?'); values.push(body.instructions); }
  if (body.settings !== undefined) { updates.push('settings_json = ?'); values.push(JSON.stringify(body.settings)); }
  if (body.timeLimitMinutes !== undefined) { updates.push('time_limit_minutes = ?'); values.push(body.timeLimitMinutes); }
  
  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await db.prepare(`UPDATE test_sessions SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await db.prepare('SELECT * FROM test_sessions WHERE id = ?').bind(id).first();
  return c.json(updated);
});

export default app;