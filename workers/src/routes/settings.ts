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
  
  const admins = await db.prepare(
    'SELECT id, full_name, email, role, status, last_login_at FROM admins ORDER BY created_at'
  ).all();
  
  return c.json({
    profile: {
      id: admin.id,
      fullName: admin.email,
      email: admin.email,
      role: admin.role,
    },
    sessionDefaults: {
      defaultTimeLimit: 30,
      defaultInstructions: 'Please answer all questions carefully.',
    },
    admins: admins.results || [],
  });
});

app.patch('/profile', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  await db.prepare(
    "UPDATE admins SET full_name = ?, email = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(body.fullName, body.email, admin.id).run();
  
  const updated = await db.prepare(
    'SELECT id, full_name, email, role FROM admins WHERE id = ?'
  ).bind(admin.id).first();
  
  return c.json(updated);
});

app.patch('/session-defaults', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  return c.json({
    defaultTimeLimit: body.defaultTimeLimit || 30,
    defaultInstructions: body.defaultInstructions || 'Please answer all questions carefully.',
  });
});

export default app;