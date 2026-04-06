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
  const accountType = c.req.query('accountType') || '';
  
  let query = `
    SELECT id, full_name, email, account_type, organization_name, status, created_at, last_login_at
    FROM customer_accounts
  `;
  
  const conditions: string[] = [];
  const params: string[] = [];
  
  if (search) {
    conditions.push(`(full_name LIKE ? OR email LIKE ? OR organization_name LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push(`status = ?`);
    params.push(status);
  }
  if (accountType) {
    conditions.push(`account_type = ?`);
    params.push(accountType);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
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
  
  const customer = await db.prepare(
    'SELECT id, full_name, email, account_type, organization_name, status, settings_json, created_at FROM customer_accounts WHERE id = ?'
  ).bind(id).first();
  
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json(customer);
});

app.patch('/:id/status', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM customer_accounts WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  await db.prepare(
    "UPDATE customer_accounts SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(body.status, id).run();
  
  return c.json({ id: parseInt(id), status: body.status });
});

export default app;