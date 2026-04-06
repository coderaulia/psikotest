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

// List assessments
app.get('/assessments', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const assessments = await db.prepare(`
    SELECT ca.id, ca.customer_account_id, ca.test_session_id, ca.organization_name_snapshot, 
           ca.onboarding_status, ca.plan_status, ca.created_at, ca.updated_at,
           ts.title as session_title, ts.access_token, ts.status as session_status,
           tt.name as test_type_name, tt.code as test_type_code
    FROM customer_assessments ca
    JOIN test_sessions ts ON ca.test_session_id = ts.id
    JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ca.customer_account_id = ?
    ORDER BY ca.created_at DESC
  `).bind(customer.id).all();
  
  return c.json({ items: assessments.results || [] });
});

// Get assessment detail
app.get('/assessments/:id', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const assessment = await db.prepare(`
    SELECT ca.*, ts.title as session_title, ts.description, ts.access_token, 
           ts.instructions, ts.time_limit_minutes, ts.status as session_status,
           tt.name as test_type_name, tt.code as test_type_code
    FROM customer_assessments ca
    JOIN test_sessions ts ON ca.test_session_id = ts.id
    JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ca.id = ? AND ca.customer_account_id = ?
  `).bind(id, customer.id).first();
  
  if (!assessment) {
    return c.json({ error: 'Assessment not found' }, 404);
  }
  
  // Get participant count
  const participantCount = await db.prepare(`
    SELECT COUNT(*) as count FROM customer_assessment_participants WHERE customer_assessment_id = ?
  `).bind(id).first();
  
  return c.json({
    ...assessment,
    participantCount: (participantCount as any)?.count || 0,
  });
});

// Create assessment
app.post('/assessments', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Get customer organization name
  const customerAccount = await db.prepare(
    'SELECT organization_name FROM customer_accounts WHERE id = ?'
  ).bind(customer.id).first();
  
  // Create test session first
  const accessToken = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const sessionResult = await db.prepare(`
    INSERT INTO test_sessions (test_type_id, title, description, access_token, instructions, status, time_limit_minutes, created_by_admin_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, 1, datetime('now'), datetime('now'))
  `).bind(
    body.testTypeId || 1,
    body.title,
    body.description || '',
    accessToken,
    body.instructions || '',
    body.timeLimitMinutes || 30
  ).run();
  
  const sessionId = sessionResult.meta.last_row_id;
  
  // Create customer assessment
  const result = await db.prepare(`
    INSERT INTO customer_assessments (customer_account_id, test_session_id, organization_name_snapshot, onboarding_status, plan_status, created_at, updated_at)
    VALUES (?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
  `).bind(
    customer.id,
    sessionId,
    (customerAccount as any)?.organization_name || 'Unknown',
    body.planStatus || 'trial'
  ).run();
  
  const newId = result.meta.last_row_id;
  const assessment = await db.prepare(`
    SELECT ca.*, ts.title as session_title, ts.access_token, tt.name as test_type_name
    FROM customer_assessments ca
    JOIN test_sessions ts ON ca.test_session_id = ts.id
    JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ca.id = ?
  `).bind(newId).first();
  
  return c.json(assessment);
});

// Update assessment
app.patch('/assessments/:id', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare(
    'SELECT * FROM customer_assessments WHERE id = ? AND customer_account_id = ?'
  ).bind(id, customer.id).first();
  
  if (!existing) {
    return c.json({ error: 'Assessment not found' }, 404);
  }
  
  // Update test session
  const sessionUpdates: string[] = [];
  const sessionValues: any[] = [];
  
  if (body.title !== undefined) { sessionUpdates.push('title = ?'); sessionValues.push(body.title); }
  if (body.description !== undefined) { sessionUpdates.push('description = ?'); sessionValues.push(body.description); }
  if (body.instructions !== undefined) { sessionUpdates.push('instructions = ?'); sessionValues.push(body.instructions); }
  if (body.timeLimitMinutes !== undefined) { sessionUpdates.push('time_limit_minutes = ?'); sessionValues.push(body.timeLimitMinutes); }
  
  if (sessionUpdates.length > 0) {
    sessionUpdates.push("updated_at = datetime('now')");
    sessionValues.push((existing as any).test_session_id);
    await db.prepare(`UPDATE test_sessions SET ${sessionUpdates.join(', ')} WHERE id = ?`).bind(...sessionValues).run();
  }
  
  // Update customer assessment
  if (body.onboardingStatus !== undefined) {
    await db.prepare("UPDATE customer_assessments SET onboarding_status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.onboardingStatus, id).run();
  }
  
  if (body.planStatus !== undefined) {
    await db.prepare("UPDATE customer_assessments SET plan_status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.planStatus, id).run();
  }
  
  const updated = await db.prepare(`
    SELECT ca.*, ts.title as session_title, ts.access_token, tt.name as test_type_name
    FROM customer_assessments ca
    JOIN test_sessions ts ON ca.test_session_id = ts.id
    JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ca.id = ?
  `).bind(id).first();
  
  return c.json(updated);
});

// Activate assessment
app.post('/assessments/:id/activate', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const existing = await db.prepare(
    'SELECT * FROM customer_assessments WHERE id = ? AND customer_account_id = ?'
  ).bind(id, customer.id).first();
  
  if (!existing) {
    return c.json({ error: 'Assessment not found' }, 404);
  }
  
  // Activate test session
  await db.prepare("UPDATE test_sessions SET status = 'active', updated_at = datetime('now') WHERE id = ?")
    .bind((existing as any).test_session_id).run();
  
  // Update assessment status
  await db.prepare("UPDATE customer_assessments SET onboarding_status = 'ready', updated_at = datetime('now') WHERE id = ?")
    .bind(id).run();
  
  return c.json({ success: true, status: 'active' });
});

// Checkout/complete assessment setup
app.post('/assessments/:id/checkout', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  await db.prepare("UPDATE customer_assessments SET plan_status = 'upgraded', updated_at = datetime('now') WHERE id = ?")
    .bind(id).run();
  
  return c.json({ success: true });
});

// Get assessment participants
app.get('/assessments/:id/participants', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const participants = await db.prepare(`
    SELECT id, customer_assessment_id, full_name, email, employee_code, department, position_title,
           note, invitation_status, invited_via, invited_at, reminder_count, last_reminder_at, created_at
    FROM customer_assessment_participants
    WHERE customer_assessment_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();
  
  return c.json({ items: participants.results || [] });
});

// Create participant
app.post('/assessments/:id/participants', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const result = await db.prepare(`
    INSERT INTO customer_assessment_participants (customer_assessment_id, full_name, email, employee_code, department, position_title, note, invitation_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
  `).bind(
    id,
    body.fullName,
    body.email,
    body.employeeCode || null,
    body.department || null,
    body.positionTitle || null,
    body.note || null
  ).run();
  
  const newId = result.meta.last_row_id;
  const participant = await db.prepare(
    'SELECT * FROM customer_assessment_participants WHERE id = ?'
  ).bind(newId).first();
  
  return c.json(participant);
});

// Send invite to participant
app.post('/assessments/:id/participants/:pid/send', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const pid = c.req.param('pid');
  
  await db.prepare(`
    UPDATE customer_assessment_participants 
    SET invitation_status = 'invited', invited_at = datetime('now'), invited_via = 'email', updated_at = datetime('now')
    WHERE id = ?
  `).bind(pid).run();
  
  return c.json({ success: true, message: 'Invitation sent' });
});

// Send bulk invites
app.post('/assessments/:id/participants/send-bulk', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const participantIds = body.participantIds || [];
  
  for (const pid of participantIds) {
    await db.prepare(`
      UPDATE customer_assessment_participants 
      SET invitation_status = 'invited', invited_at = datetime('now'), invited_via = 'email', updated_at = datetime('now')
      WHERE id = ? AND customer_assessment_id = ?
    `).bind(pid, id).run();
  }
  
  return c.json({ success: true, sent: participantIds.length });
});

// Send reminder to participant
app.post('/assessments/:id/participants/:pid/remind', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const pid = c.req.param('pid');
  
  await db.prepare(`
    UPDATE customer_assessment_participants 
    SET reminder_count = reminder_count + 1, last_reminder_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(pid).run();
  
  return c.json({ success: true, message: 'Reminder sent' });
});

// Send bulk reminders
app.post('/assessments/:id/participants/remind-bulk', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const participantIds = body.participantIds || [];
  
  for (const pid of participantIds) {
    await db.prepare(`
      UPDATE customer_assessment_participants 
      SET reminder_count = reminder_count + 1, last_reminder_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND customer_assessment_id = ?
    `).bind(pid, id).run();
  }
  
  return c.json({ success: true, reminded: participantIds.length });
});

// Import participants (CSV)
app.post('/assessments/:id/participants/import', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const participants = body.participants || [];
  
  let imported = 0;
  for (const p of participants) {
    await db.prepare(`
      INSERT INTO customer_assessment_participants (customer_assessment_id, full_name, email, employee_code, department, position_title, invitation_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
    `).bind(
      id,
      p.fullName,
      p.email,
      p.employeeCode || null,
      p.department || null,
      p.positionTitle || null
    ).run();
    imported++;
  }
  
  return c.json({ success: true, imported });
});

export default app;