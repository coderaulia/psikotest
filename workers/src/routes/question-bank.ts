import { Hono } from 'hono';
import type { Env } from '../index';
import { verifyAdminToken } from './admin-middleware';

const app = new Hono<{ Bindings: Env }>();

app.get('/questions', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const search = c.req.query('search') || '';
  const testType = c.req.query('testType') || '';
  const status = c.req.query('status') || '';
  
  let query = `
    SELECT q.id, q.test_type_id, tt.code as test_type_code, q.question_code, q.prompt, q.question_type, q.question_order, q.status, q.created_at
    FROM questions q
    LEFT JOIN test_types tt ON q.test_type_id = tt.id
  `;
  
  const conditions: string[] = [];
  const params: string[] = [];
  
  if (search) {
    conditions.push(`(q.prompt LIKE ? OR q.question_code LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }
  if (testType) {
    conditions.push(`tt.code = ?`);
    params.push(testType);
  }
  if (status) {
    conditions.push(`q.status = ?`);
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ` ORDER BY q.test_type_id, q.question_order LIMIT 100`;
  
  const stmt = db.prepare(query);
  const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await boundStmt.all();
  
  return c.json({ items: result.results || [] });
});

app.get('/questions/:id', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const question = await db.prepare(`
    SELECT q.*, tt.code as test_type_code
    FROM questions q
    LEFT JOIN test_types tt ON q.test_type_id = tt.id
    WHERE q.id = ?
  `).bind(id).first();
  
  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }
  
  const options = await db.prepare(`
    SELECT id, question_id, option_key, option_text, dimension_key, value_number, option_order
    FROM question_options
    WHERE question_id = ?
    ORDER BY option_order
  `).bind(id).all();
  
  return c.json({
    ...question,
    options: options.results || [],
  });
});

app.post('/questions', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  const result = await db.prepare(`
    INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    body.testTypeId,
    body.questionCode,
    body.instructionText || null,
    body.prompt,
    body.questionGroupKey || null,
    body.dimensionKey || null,
    body.questionType || 'single',
    body.questionOrder || 1,
    body.isRequired !== false ? 1 : 0,
    body.status || 'active'
  ).run();
  
  const newId = result.meta.last_row_id;
  const newQuestion = await db.prepare('SELECT * FROM questions WHERE id = ?').bind(newId).first();
  return c.json(newQuestion);
});

app.patch('/questions/:id', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM questions WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Question not found' }, 404);
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.prompt !== undefined) { updates.push('prompt = ?'); values.push(body.prompt); }
  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.questionOrder !== undefined) { updates.push('question_order = ?'); values.push(body.questionOrder); }
  
  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await db.prepare(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await db.prepare('SELECT * FROM questions WHERE id = ?').bind(id).first();
  return c.json(updated);
});

export default app;