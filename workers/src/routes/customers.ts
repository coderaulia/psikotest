import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

app.use('*', requireAdmin);

// Ensure only super_admin can manage customers
async function assertSuperAdmin(c: { get: (key: string) => unknown; json: (body: unknown, status: number) => Response }, next: () => Promise<void>) {
  const payload = c.get('adminPayload') as AdminJwtPayload;
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }
  await next();
}

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  accountType: z.enum(['business', 'researcher']).optional(),
});

// GET /api/customers
app.get('/', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const filters = listQuerySchema.parse(c.req.query());

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(ca.full_name LIKE ? OR ca.email LIKE ? OR ca.organization_name LIKE ?)');
    params.push(like, like, like);
  }
  if (filters.status) {
    conditions.push('ca.status = ?');
    params.push(filters.status);
  }
  if (filters.accountType) {
    conditions.push('ca.account_type = ?');
    params.push(filters.accountType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    c.env.DB,
    `SELECT
       ca.id,
       ca.full_name,
       ca.email,
       ca.account_type,
       ca.organization_name,
       ca.status,
       ca.last_login_at,
       ca.created_at,
       COUNT(DISTINCT ts.id) AS session_count
     FROM customer_accounts ca
     LEFT JOIN test_sessions ts ON ts.created_by = ca.id
     ${where}
     GROUP BY ca.id, ca.full_name, ca.email, ca.account_type, ca.organization_name, ca.status, ca.last_login_at, ca.created_at
     ORDER BY ca.created_at DESC`,
    params,
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      accountType: row.account_type,
      organizationName: row.organization_name,
      status: row.status,
      lastLoginAt: row.last_login_at ?? null,
      createdAt: row.created_at ?? null,
      sessionCount: Number(row.session_count ?? 0),
    };
  });

  return c.json({ items });
});

// GET /api/customers/:id
app.get('/:id', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid customer id' }, 400);
  }

  const customer = await queryOne<Record<string, unknown>>(
    c.env.DB,
    `SELECT id, full_name, email, account_type, organization_name, status, last_login_at, created_at
     FROM customer_accounts WHERE id = ? LIMIT 1`,
    [id],
  );

  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  // Fetch workspace members
  const memberRows = await query(
    c.env.DB,
    `SELECT id, full_name, email, role, invitation_status, last_login_at, created_at
     FROM customer_workspace_members
     WHERE customer_account_id = ?
     ORDER BY created_at DESC`,
    [id],
  );

  return c.json({
    customer: {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      accountType: customer.account_type,
      organizationName: customer.organization_name,
      status: customer.status,
      lastLoginAt: customer.last_login_at ?? null,
      createdAt: customer.created_at ?? null,
    },
    members: (memberRows.results ?? []).map((m) => {
      const member = m as Record<string, unknown>;
      return {
        id: member.id,
        fullName: member.full_name,
        email: member.email,
        role: member.role,
        invitationStatus: member.invitation_status,
        lastLoginAt: member.last_login_at ?? null,
        createdAt: member.created_at ?? null,
      };
    }),
  });
});

// PATCH /api/customers/:id/status
app.patch('/:id/status', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid customer id' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const { status } = z.object({ status: z.enum(['active', 'inactive']) }).parse(body);

  const existing = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM customer_accounts WHERE id = ? LIMIT 1',
    [id],
  );
  if (!existing) return c.json({ error: 'Customer not found' }, 404);

  await run(
    c.env.DB,
    'UPDATE customer_accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
  );

  return c.json({ id, status });
});

export default app;
