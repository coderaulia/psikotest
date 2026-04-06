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

// Get workspace settings
app.get('/settings', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const account = await db.prepare(
    'SELECT id, full_name, email, account_type, organization_name, settings_json, status FROM customer_accounts WHERE id = ?'
  ).bind(customer.id).first();
  
  if (!account) {
    return c.json({ error: 'Account not found' }, 404);
  }
  
  let settings = {};
  try {
    settings = JSON.parse((account as any).settings_json || '{}');
  } catch {
    settings = {};
  }
  
  return c.json({
    id: (account as any).id,
    organizationName: (account as any).organization_name,
    accountType: (account as any).account_type,
    settings: {
      brandName: settings.brandName || (account as any).organization_name,
      brandTagline: settings.brandTagline || '',
      supportEmail: settings.supportEmail || (account as any).email,
      contactPerson: settings.contactPerson || (account as any).full_name,
      defaultAssessmentPurpose: settings.defaultAssessmentPurpose || 'recruitment',
      defaultAdministrationMode: settings.defaultAdministrationMode || 'remote_unsupervised',
      defaultResultVisibility: settings.defaultResultVisibility || 'review_required',
      defaultParticipantLimit: settings.defaultParticipantLimit || 25,
      defaultTimeLimitMinutes: settings.defaultTimeLimitMinutes || 30,
      defaultConsentStatement: settings.defaultConsentStatement || '',
      defaultPrivacyStatement: settings.defaultPrivacyStatement || '',
    }
  });
});

// Update workspace settings
app.patch('/settings', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  const existing = await db.prepare(
    'SELECT settings_json FROM customer_accounts WHERE id = ?'
  ).bind(customer.id).first();
  
  let currentSettings = {};
  try {
    currentSettings = JSON.parse((existing as any)?.settings_json || '{}');
  } catch {
    currentSettings = {};
  }
  
  const newSettings = {
    ...currentSettings,
    ...body,
  };
  
  await db.prepare(
    "UPDATE customer_accounts SET settings_json = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(JSON.stringify(newSettings), customer.id).run();
  
  return c.json({ success: true, settings: newSettings });
});

// Get team members
app.get('/team', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const members = await db.prepare(`
    SELECT id, full_name, email, role, invitation_status, invited_at, activated_at, last_login_at
    FROM customer_workspace_members
    WHERE customer_account_id = ?
    ORDER BY created_at DESC
  `).bind(customer.id).all();
  
  return c.json({ items: members.results || [] });
});

// Create team member (send invite)
app.post('/team', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Check if email already exists
  const existing = await db.prepare(
    'SELECT id FROM customer_workspace_members WHERE email = ? AND customer_account_id = ?'
  ).bind(body.email, customer.id).first();
  
  if (existing) {
    return c.json({ error: 'Team member with this email already exists' }, 400);
  }
  
  const activationToken = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  const result = await db.prepare(`
    INSERT INTO customer_workspace_members (customer_account_id, full_name, email, role, invitation_status, activation_token, activation_expires_at, invited_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'invited', ?, datetime('now', '+7 days'), datetime('now'), datetime('now'), datetime('now'))
  `).bind(
    customer.id,
    body.fullName,
    body.email,
    body.role || 'operator',
    activationToken
  ).run();
  
  const newId = result.meta.last_row_id;
  const member = await db.prepare(
    'SELECT * FROM customer_workspace_members WHERE id = ?'
  ).bind(newId).first();
  
  return c.json(member);
});

// Send team invite
app.post('/team/:id/send', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const member = await db.prepare(
    'SELECT * FROM customer_workspace_members WHERE id = ? AND customer_account_id = ?'
  ).bind(id, customer.id).first();
  
  if (!member) {
    return c.json({ error: 'Team member not found' }, 404);
  }
  
  // Update invite sent timestamp
  await db.prepare(`
    UPDATE customer_workspace_members 
    SET invited_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(id).run();
  
  return c.json({ success: true, message: 'Invitation sent' });
});

// Get workspace activity
app.get('/activity', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  // Get recent assessments
  const assessments = await db.prepare(`
    SELECT ca.id, ca.created_at, ts.title as assessment_title, tt.name as test_type_name, ca.plan_status
    FROM customer_assessments ca
    JOIN test_sessions ts ON ca.test_session_id = ts.id
    JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ca.customer_account_id = ?
    ORDER BY ca.created_at DESC
    LIMIT 10
  `).bind(customer.id).all();
  
  // Get recent participants/submissions
  const submissions = await db.prepare(`
    SELECT s.id, s.created_at, p.full_name as participant_name, s.status
    FROM submissions s
    JOIN customer_assessments ca ON s.test_session_id = ca.test_session_id
    JOIN participants p ON s.participant_id = p.id
    WHERE ca.customer_account_id = ?
    ORDER BY s.created_at DESC
    LIMIT 10
  `).bind(customer.id).all();
  
  return c.json({
    recentAssessments: assessments.results || [],
    recentSubmissions: submissions.results || [],
  });
});

export default app;