import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';
import { ensureWorkspaceSubscription, syncWorkspaceUsageSnapshot, getPlanCatalog } from '../lib/customer-workspace';

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
       COUNT(DISTINCT ca_test.test_session_id) AS session_count
      FROM customer_accounts ca
      LEFT JOIN customer_assessments ca_test ON ca_test.customer_account_id = ca.id
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

// GET /api/customers/webhooks
app.get('/webhooks', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const events = await query(
    c.env.DB,
    `SELECT * FROM billing_webhook_events ORDER BY created_at DESC LIMIT 50`
  );

  return c.json({ events: events.results ?? [] });
});

// GET /api/customers/:id/billing
app.get('/:id/billing', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) return c.json({ error: 'Invalid customer id' }, 400);

  const customer = await queryOne<Record<string, unknown>>(
    c.env.DB,
    `SELECT id, email, status, account_type FROM customer_accounts WHERE id = ? LIMIT 1`,
    [id],
  );

  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  const subscription = await ensureWorkspaceSubscription(c.env.DB, { 
    id: customer.id as number, 
    email: customer.email as string, 
    account_type: customer.account_type as any 
  });

  const usage = await syncWorkspaceUsageSnapshot(c.env.DB, id, subscription);

  const invoiceRows = await query(
    c.env.DB,
    `SELECT id, status, amount_total, currency_code, issued_at 
     FROM billing_invoices 
     WHERE customer_account_id = ? 
     ORDER BY created_at DESC LIMIT 3`,
    [id]
  );

  return c.json({
    subscription: {
      id: subscription.id,
      planCode: subscription.plan_code,
      status: subscription.status,
      billingCycle: subscription.billing_cycle,
      trialEndsAt: subscription.trial_ends_at,
      renewsAt: subscription.renews_at,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      assessmentLimit: subscription.assessment_limit,
      participantLimit: subscription.participant_limit,
      teamMemberLimit: subscription.team_member_limit,
    },
    usage: {
      activeAssessmentCount: usage.activeAssessmentCount,
      participantRecordCount: usage.participantRecordCount,
      teamSeatCount: usage.teamSeatCount,
    },
    invoices: (invoiceRows.results ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: Number(row.id),
        status: row.status,
        amountTotal: Number(row.amount_total ?? 0),
        currencyCode: row.currency_code,
        issuedAt: row.issued_at,
      };
    })
  });
});

// PATCH /api/customers/:id/billing
app.patch('/:id/billing', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) return c.json({ error: 'Invalid customer id' }, 400);

  const body = await c.req.json().catch(() => ({}));

  const updateSchema = z.object({
    planCode: z.enum(['starter', 'growth', 'research']).optional(),
    status: z.enum(['trial', 'active', 'past_due', 'suspended']).optional(),
    trialEndsAt: z.string().nullable().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    billingCycle: z.enum(['monthly', 'annual']).optional(),
  });

  const updates = updateSchema.parse(body);

  const b = [];
  const params = [];
  const plans = getPlanCatalog();

  if (updates.planCode) {
    b.push('plan_code = ?');
    params.push(updates.planCode);
    const plan = plans[updates.planCode];
    if (plan) {
      b.push('assessment_limit = ?'); params.push(plan.assessmentLimit);
      b.push('participant_limit = ?'); params.push(plan.participantLimit);
      b.push('team_member_limit = ?'); params.push(plan.teamMemberLimit);
    }
  }

  if (updates.status) {
    b.push('status = ?'); params.push(updates.status);
  }

  if (updates.trialEndsAt !== undefined) {
    b.push('trial_ends_at = ?'); params.push(updates.trialEndsAt);
  }

  if (updates.cancelAtPeriodEnd !== undefined) {
    b.push('cancel_at_period_end = ?'); params.push(updates.cancelAtPeriodEnd ? 1 : 0);
  }

  if (updates.billingCycle) {
    b.push('billing_cycle = ?'); params.push(updates.billingCycle);
  }

  if (b.length > 0) {
    params.push(id);
    await run(
      c.env.DB,
      `UPDATE workspace_subscriptions 
       SET ${b.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE customer_account_id = ?`,
      params
    );
  }

  return c.json({ success: true });
});

// POST /api/customers/:id/invoices
app.post('/:id/invoices', async (c) => {
  const payload = c.get('adminPayload');
  if (payload.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }

  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) return c.json({ error: 'Invalid customer id' }, 400);

  const body = await c.req.json().catch(() => ({}));
  const schema = z.object({
    amount: z.number().min(0),
    currencyCode: z.string().default('USD'),
    status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']).default('open'),
  });

  const data = schema.parse(body);

  const subscription = await queryOne<{ id: number }>(
    c.env.DB,
    `SELECT id FROM workspace_subscriptions WHERE customer_account_id = ? LIMIT 1`,
    [id]
  );

  if (!subscription) {
    return c.json({ error: 'No subscription found for customer' }, 404);
  }

  const invoiceNumber = `INV-${Date.now()}`;

  await run(
    c.env.DB,
    `INSERT INTO billing_invoices (
      customer_account_id, workspace_subscription_id, invoice_number, status, currency_code, amount_subtotal, amount_total, issued_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, subscription.id, invoiceNumber, data.status, data.currencyCode, data.amount, data.amount]
  );

  return c.json({ success: true });
});

export default app;
