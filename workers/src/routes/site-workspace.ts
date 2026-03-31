import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  buildParticipantLink,
  ensureWorkspaceSubscription,
  mapCustomerUser,
  parseWorkspaceSettings,
  recordWorkspaceUsageEvent,
  requireActiveCustomer,
  requireWorkspaceRole,
  syncWorkspaceUsageSnapshot,
  type WorkspaceRole,
} from '../lib/customer-workspace';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();

const workspaceSettingsSchema = z.object({
  organizationName: z.string().min(2).max(190),
  brandName: z.string().min(2).max(190),
  brandTagline: z.string().min(3).max(240),
  supportEmail: z.string().email(),
  contactPerson: z.string().min(2).max(150),
  defaultAssessmentPurpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  defaultAdministrationMode: z.enum(['supervised', 'remote_unsupervised']),
  defaultResultVisibility: z.enum(['participant_summary', 'review_required']),
  defaultParticipantLimit: z.coerce.number().int().positive().max(50000).nullable(),
  defaultTimeLimitMinutes: z.coerce.number().int().positive().max(180).nullable(),
  defaultConsentStatement: z.string().min(10).max(2000),
  defaultPrivacyStatement: z.string().min(10).max(2000),
});

const workspaceMemberSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  role: z.enum(['admin', 'operator', 'reviewer']),
});

function buildOwnerMember(account: { id: number; full_name: string; email: string }) {
  return {
    id: account.id,
    fullName: account.full_name,
    email: account.email,
    role: 'owner',
    status: 'active',
    source: 'owner',
    invitedAt: null,
    lastNotifiedAt: null,
    activatedAt: null,
    activationExpiresAt: null,
    lastLoginAt: null,
  };
}

function buildActivationLink(origin: string, token: string) {
  return `${origin.replace(/\/$/, '')}/accept-workspace-invite/${token}`;
}

function buildLoginLink(origin: string) {
  return `${origin.replace(/\/$/, '')}/login`;
}

app.use('*', requireCustomer);

app.get('/settings', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace settings are limited to owners and workspace admins');
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  return c.json({
    account: mapCustomerUser(account, payload),
    settings: parseWorkspaceSettings(account),
  });
});

app.patch('/settings', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace settings are limited to owners and workspace admins');
  const body = workspaceSettingsSchema.parse(await c.req.json());
  const settingsJson = JSON.stringify({
    brandName: body.brandName.trim(),
    brandTagline: body.brandTagline.trim(),
    supportEmail: body.supportEmail.trim().toLowerCase(),
    contactPerson: body.contactPerson.trim(),
    defaultAssessmentPurpose: body.defaultAssessmentPurpose,
    defaultAdministrationMode: body.defaultAdministrationMode,
    defaultResultVisibility: body.defaultResultVisibility,
    defaultParticipantLimit: body.defaultParticipantLimit,
    defaultTimeLimitMinutes: body.defaultTimeLimitMinutes,
    defaultConsentStatement: body.defaultConsentStatement.trim(),
    defaultPrivacyStatement: body.defaultPrivacyStatement.trim(),
  });

  await run(c.env.DB, `UPDATE customer_accounts SET organization_name = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [body.organizationName.trim(), settingsJson, payload.accountId]);
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  return c.json({
    account: mapCustomerUser(account, payload),
    settings: parseWorkspaceSettings(account),
  });
});

app.get('/activity', async (c) => {
  const payload = c.get('customerPayload');
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const result = await query(
    c.env.DB,
    `SELECT id, actor_type, actor_admin_id, actor_customer_id, entity_type, entity_id, action, metadata_json, created_at
     FROM audit_events
     WHERE actor_customer_id = ?
     ORDER BY created_at DESC
     LIMIT 24`,
    [payload.accountId],
  );

  const items = (result.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    const action = String(item.action);
    const metadata = item.metadata_json ? JSON.parse(String(item.metadata_json)) : {};
    const category = action.startsWith('customer_assessment_participant.')
      ? 'participant_delivery'
      : action.startsWith('customer_assessment.')
        ? 'assessment'
        : action.startsWith('customer_workspace.member_')
          ? 'team'
          : action.startsWith('workspace_subscription.') || action.startsWith('billing_')
            ? 'billing'
            : 'workspace';
    return {
      id: Number(item.id),
      actorType: item.actor_type,
      actorAdminId: item.actor_admin_id ? Number(item.actor_admin_id) : null,
      actorName: null,
      entityType: item.entity_type,
      entityId: item.entity_id ? Number(item.entity_id) : null,
      action,
      category,
      label: action.replace(/[._]/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase()),
      description: 'Workspace activity recorded for audit and operational tracking.',
      metadata,
      createdAt: item.created_at,
    };
  });

  return c.json({
    workspace: {
      organizationName: account.organization_name,
      accountType: account.account_type,
    },
    summary: {
      totalEvents: items.length,
      assessmentEvents: items.filter((item) => item.category === 'assessment').length,
      participantDeliveryEvents: items.filter((item) => item.category === 'participant_delivery').length,
      teamEvents: items.filter((item) => item.category === 'team').length,
      billingEvents: items.filter((item) => item.category === 'billing').length,
    },
    items,
  });
});

app.get('/team', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace team access is limited to owners and workspace admins');
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const result = await query(
    c.env.DB,
    `SELECT id, full_name, email, role, invitation_status, invited_at, last_notified_at, activated_at, activation_expires_at, last_login_at
     FROM customer_workspace_members
     WHERE customer_account_id = ?
     ORDER BY created_at DESC`,
    [payload.accountId],
  );

  return c.json({
    workspace: {
      organizationName: account.organization_name,
      ownerName: account.full_name,
      ownerEmail: account.email,
      accountType: account.account_type,
    },
    items: [
      buildOwnerMember(account),
      ...(result.results ?? []).map((row) => {
        const item = row as Record<string, unknown>;
        return {
          id: Number(item.id),
          fullName: item.full_name,
          email: item.email,
          role: item.role,
          status: item.invitation_status === 'active' ? 'active' : 'invited',
          source: 'workspace_member',
          invitedAt: item.invited_at ?? null,
          lastNotifiedAt: item.last_notified_at ?? null,
          activatedAt: item.activated_at ?? null,
          activationExpiresAt: item.activation_expires_at ?? null,
          lastLoginAt: item.last_login_at ?? null,
        };
      }),
    ],
  });
});

app.post('/team', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace team management is limited to owners and workspace admins');
  const body = workspaceMemberSchema.parse(await c.req.json());
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  const usage = await syncWorkspaceUsageSnapshot(c.env.DB, payload.accountId, subscription);
  if (usage.teamSeatCount >= subscription.team_member_limit) {
    throw new HTTPException(409, { message: 'Team member limit reached for this workspace plan' });
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const existing = await queryOne<{ id: number }>(c.env.DB, 'SELECT id FROM customer_workspace_members WHERE customer_account_id = ? AND email = ? LIMIT 1', [payload.accountId, normalizedEmail]);
  if (existing) {
    await run(c.env.DB, `UPDATE customer_workspace_members SET full_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [body.fullName.trim(), body.role, existing.id]);
  } else {
    await run(c.env.DB, `INSERT INTO customer_workspace_members (customer_account_id, full_name, email, password_hash, role, invitation_status, activation_token, activation_expires_at, invited_at, activated_at, last_login_at, last_notified_at, session_version, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, 'invited', NULL, NULL, NULL, NULL, NULL, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [payload.accountId, body.fullName.trim(), normalizedEmail, body.role]);
  }

  const member = await queryOne<Record<string, unknown>>(c.env.DB, `SELECT id, full_name, email, role, invitation_status, invited_at, last_notified_at, activated_at, activation_expires_at, last_login_at FROM customer_workspace_members WHERE customer_account_id = ? AND email = ? LIMIT 1`, [payload.accountId, normalizedEmail]);
  if (!member) throw new HTTPException(500, { message: 'Workspace member could not be saved' });

  await recordWorkspaceUsageEvent(c.env.DB, {
    customerAccountId: payload.accountId,
    workspaceSubscriptionId: subscription.id,
    metricKey: 'team_member_added',
    referenceType: 'customer_workspace_member',
    referenceId: Number(member.id),
    metadata: { email: member.email, role: member.role },
  });
  await syncWorkspaceUsageSnapshot(c.env.DB, payload.accountId, subscription);

  return c.json({
    id: Number(member.id),
    fullName: member.full_name,
    email: member.email,
    role: member.role,
    status: member.invitation_status === 'active' ? 'active' : 'invited',
    source: 'workspace_member',
    invitedAt: member.invited_at ?? null,
    lastNotifiedAt: member.last_notified_at ?? null,
    activatedAt: member.activated_at ?? null,
    activationExpiresAt: member.activation_expires_at ?? null,
    lastLoginAt: member.last_login_at ?? null,
  }, 201);
});

app.post('/team/:memberId/send', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace team management is limited to owners and workspace admins');
  const memberId = Number(c.req.param('memberId'));
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const member = await queryOne<Record<string, unknown>>(c.env.DB, `SELECT id, full_name, email, role, invitation_status FROM customer_workspace_members WHERE customer_account_id = ? AND id = ? LIMIT 1`, [payload.accountId, memberId]);
  if (!member) throw new HTTPException(404, { message: 'Workspace member not found' });

  if (member.invitation_status === 'active') {
    await run(c.env.DB, `UPDATE customer_workspace_members SET last_notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [memberId]);
    return c.json({
      member: {
        id: Number(member.id),
        fullName: member.full_name,
        email: member.email,
        role: member.role,
        status: 'active',
        source: 'workspace_member',
        invitedAt: null,
        lastNotifiedAt: new Date().toISOString(),
        activatedAt: null,
        activationExpiresAt: null,
        lastLoginAt: null,
      },
      deliveryPreview: `Login reminder prepared for ${member.email}. They can sign in at ${buildLoginLink(c.env.APP_ORIGIN)}.`,
      activationLink: null,
      loginLink: buildLoginLink(c.env.APP_ORIGIN),
      expiresAt: null,
    });
  }

  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  await run(c.env.DB, `UPDATE customer_workspace_members SET activation_token = ?, activation_expires_at = ?, invited_at = COALESCE(invited_at, CURRENT_TIMESTAMP), last_notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [token, expiresAt, memberId]);

  return c.json({
    member: {
      id: Number(member.id),
      fullName: member.full_name,
      email: member.email,
      role: member.role,
      status: 'invited',
      source: 'workspace_member',
      invitedAt: new Date().toISOString(),
      lastNotifiedAt: new Date().toISOString(),
      activatedAt: null,
      activationExpiresAt: expiresAt,
      lastLoginAt: null,
    },
    deliveryPreview: `Activation link prepared for ${member.email}. It expires in 72 hours.`,
    activationLink: buildActivationLink(c.env.APP_ORIGIN, token),
    loginLink: null,
    expiresAt,
  });
});

export default app;
