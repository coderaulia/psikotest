import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Helper to verify customer token
async function verifyCustomerToken(c: typeof app extends Hono<{ Bindings: Env }> ? any : never): Promise<{ id: string; email: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.type !== 'customer') {
      return null;
    }
    return {
      id: payload.sub as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Get billing overview
app.get('/overview', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  // Get subscription
  const subscription = await db.prepare(`
    SELECT ws.*, ca.organization_name
    FROM workspace_subscriptions ws
    JOIN customer_accounts ca ON ws.customer_account_id = ca.id
    WHERE ws.customer_account_id = ?
    ORDER BY ws.created_at DESC
    LIMIT 1
  `).bind(customer.id).first();
  
  // Get usage stats
  const usageStats = await db.prepare(`
    SELECT 
      COUNT(DISTINCT ca.id) as assessment_count,
      COUNT(DISTINCT cap.id) as participant_count,
      COUNT(DISTINCT cwm.id) as team_member_count
    FROM customer_accounts cu
    LEFT JOIN customer_assessments ca ON cu.id = ca.customer_account_id
    LEFT JOIN customer_assessment_participants cap ON ca.id = cap.customer_assessment_id
    LEFT JOIN customer_workspace_members cwm ON cu.id = cwm.customer_account_id
    WHERE cu.id = ?
  `).bind(customer.id).first();
  
  return c.json({
    subscription: subscription || null,
    usage: usageStats || {
      assessment_count: 0,
      participant_count: 0,
      team_member_count: 0,
    },
  });
});

// List invoices
app.get('/invoices', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  const invoices = await db.prepare(`
    SELECT id, invoice_number, status, currency_code, amount_total, 
           hosted_invoice_url, invoice_pdf_url, issued_at, due_at, paid_at, created_at
    FROM billing_invoices
    WHERE customer_account_id = ?
    ORDER BY created_at DESC
  `).bind(customer.id).all();
  
  return c.json({ items: invoices.results || [] });
});

// Create checkout session
app.post('/checkout-session', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Get or create subscription
  let subscription = await db.prepare(
    'SELECT id FROM workspace_subscriptions WHERE customer_account_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(customer.id).first();
  
  let subscriptionId;
  if (!subscription) {
    // Create new subscription
    const subResult = await db.prepare(`
      INSERT INTO workspace_subscriptions (customer_account_id, plan_code, status, billing_cycle, billing_provider, 
        assessment_limit, participant_limit, team_member_limit, created_at, updated_at)
      VALUES (?, ?, 'trial', 'monthly', 'dummy', 5, 50, 3, datetime('now'), datetime('now'))
    `).bind(customer.id, body.planCode || 'starter').run();
    subscriptionId = subResult.meta.last_row_id;
  } else {
    subscriptionId = (subscription as any).id;
  }
  
  // Create checkout session
  const sessionKey = `checkout-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const result = await db.prepare(`
    INSERT INTO billing_checkout_sessions (customer_account_id, workspace_subscription_id, session_key, 
      billing_provider, plan_code, billing_cycle, status, created_at, updated_at)
    VALUES (?, ?, ?, 'dummy', ?, ?, 'open', datetime('now'), datetime('now'))
  `).bind(
    customer.id,
    subscriptionId,
    sessionKey,
    body.planCode || 'starter',
    body.billingCycle || 'monthly'
  ).run();
  
  const newId = result.meta.last_row_id;
  const checkoutSession = await db.prepare(
    'SELECT * FROM billing_checkout_sessions WHERE id = ?'
  ).bind(newId).first();
  
  return c.json({
    ...checkoutSession,
    checkoutUrl: `https://psikotest.vanaila.com/billing/checkout?session=${sessionKey}`,
  });
});

// Update subscription
app.patch('/subscription', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  const subscription = await db.prepare(
    'SELECT id FROM workspace_subscriptions WHERE customer_account_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(customer.id).first();
  
  if (!subscription) {
    return c.json({ error: 'No subscription found' }, 404);
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.planCode !== undefined) { updates.push('plan_code = ?'); values.push(body.planCode); }
  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.billingCycle !== undefined) { updates.push('billing_cycle = ?'); values.push(body.billingCycle); }
  if (body.assessmentLimit !== undefined) { updates.push('assessment_limit = ?'); values.push(body.assessmentLimit); }
  if (body.participantLimit !== undefined) { updates.push('participant_limit = ?'); values.push(body.participantLimit); }
  if (body.teamMemberLimit !== undefined) { updates.push('team_member_limit = ?'); values.push(body.teamMemberLimit); }
  
  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push((subscription as any).id);
    await db.prepare(`UPDATE workspace_subscriptions SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  }
  
  const updated = await db.prepare(
    'SELECT * FROM workspace_subscriptions WHERE id = ?'
  ).bind((subscription as any).id).first();
  
  return c.json(updated);
});

export default app;