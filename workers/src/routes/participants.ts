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
  
  let query = `SELECT id, full_name, email, employee_code, department, position_title, created_at FROM participants`;
  const params: string[] = [];
  
  if (search) {
    query += ` WHERE full_name LIKE ? OR email LIKE ? OR employee_code LIKE ?`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  query += ` ORDER BY created_at DESC LIMIT 100`;
  
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
  
  const participant = await db.prepare(
    'SELECT id, full_name, email, employee_code, department, position_title, metadata_json, created_at FROM participants WHERE id = ?'
  ).bind(id).first();
  
  if (!participant) {
    return c.json({ error: 'Participant not found' }, 404);
  }
  
  return c.json(participant);
});

export default app;