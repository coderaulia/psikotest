import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';
import { queryOne, run } from './db';
import type { CustomerJwtPayload, Env } from '../types';

export type WorkspacePlanCode = 'starter' | 'growth' | 'research';
export type WorkspaceBillingCycle = 'monthly' | 'annual';
export type WorkspaceSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended';
export type WorkspaceBillingProvider = 'dummy' | 'manual' | 'stripe';
export type WorkspaceRole = 'owner' | 'admin' | 'operator' | 'reviewer';
export type CustomerAccountType = 'business' | 'researcher';

export interface CustomerAccountRow {
  id: number;
  full_name: string;
  email: string;
  account_type: CustomerAccountType;
  organization_name: string;
  status: 'active' | 'inactive';
  settings_json: string | null;
}

export interface WorkspaceSubscriptionRow {
  id: number;
  customer_account_id: number;
  plan_code: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billing_cycle: WorkspaceBillingCycle;
  billing_provider: WorkspaceBillingProvider;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_price_id: string | null;
  assessment_limit: number;
  participant_limit: number;
  team_member_limit: number;
  started_at: string;
  trial_ends_at: string | null;
  renews_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  canceled_at: string | null;
  past_due_at: string | null;
  suspended_at: string | null;
  plan_version: number;
  billing_contact_email: string | null;
}

interface WorkspaceUsageRow {
  activeAssessmentCount: number;
  participantRecordCount: number;
  teamSeatCount: number;
}

const workspacePlanCatalog = {
  starter: {
    label: 'Starter',
    description: 'For teams validating the first assessment workflow.',
    assessmentLimit: 3,
    participantLimit: 5,
    teamMemberLimit: 3,
    monthlyPrice: 0,
    annualPrice: 0,
  },
  growth: {
    label: 'Growth',
    description: 'For active business workspaces managing multiple assessments.',
    assessmentLimit: 20,
    participantLimit: 500,
    teamMemberLimit: 15,
    monthlyPrice: 29,
    annualPrice: 290,
  },
  research: {
    label: 'Research',
    description: 'For academic and psychology research workspaces with larger response volume.',
    assessmentLimit: 30,
    participantLimit: 2500,
    teamMemberLimit: 20,
    monthlyPrice: 39,
    annualPrice: 390,
  },
} as const;

export function getPlanCatalog() {
  return workspacePlanCatalog;
}

export function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function addBillingCycle(cycle: WorkspaceBillingCycle) {
  return addDays(cycle === 'annual' ? 365 : 30);
}

export function getDefaultPlanCode(accountType: CustomerAccountType): WorkspacePlanCode {
  return accountType === 'researcher' ? 'research' : 'starter';
}

export function generateToken(bytes = 24) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function mapCustomerUser(account: CustomerAccountRow, session: CustomerJwtPayload) {
  return {
    id: account.id,
    fullName: session.actorType === 'owner' ? account.full_name : session.email,
    email: session.email,
    accountType: account.account_type,
    organizationName: account.organization_name,
    workspaceRole: session.workspaceRole,
    sessionSource: session.actorType === 'owner' ? 'owner' : 'workspace_member',
    workspaceMemberId: session.actorType === 'workspace_member' ? session.actorId : null,
  };
}

export function buildParticipantLink(origin: string, accessToken: string) {
  return `${origin.replace(/\/$/, '')}/t/${accessToken}`;
}

export function buildPreviewDemoLink(origin: string, testType: 'iq' | 'disc' | 'workload' | 'custom') {
  const token = testType === 'iq'
    ? 'iq-public-001'
    : testType === 'disc'
      ? 'disc-public-001'
      : testType === 'workload'
        ? 'workload-public-001'
        : 'research-scale-pilot';

  return `${origin.replace(/\/$/, '')}/t/${token}`;
}

export function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(value) as Record<string, unknown>) } as T;
  } catch {
    return fallback;
  }
}

export function parseWorkspaceSettings(account: Pick<CustomerAccountRow, 'organization_name' | 'full_name' | 'email' | 'account_type' | 'settings_json'>) {
  const defaults = {
    brandName: account.organization_name || (account.account_type === 'researcher' ? 'Research Workspace' : 'Assessment Workspace'),
    brandTagline: account.account_type === 'researcher'
      ? 'Structured research assessments and participant data collection.'
      : 'Structured assessment operations for teams and organizations.',
    supportEmail: account.email,
    contactPerson: account.full_name,
    defaultAssessmentPurpose: account.account_type === 'researcher' ? 'research' : 'recruitment',
    defaultAdministrationMode: 'remote_unsupervised',
    defaultResultVisibility: 'participant_summary',
    defaultParticipantLimit: account.account_type === 'researcher' ? 250 : 50,
    defaultTimeLimitMinutes: 20,
    defaultConsentStatement: `I understand that ${account.organization_name || 'this workspace'} will use my responses for the stated assessment purpose.`,
    defaultPrivacyStatement: `My responses will be processed by ${account.organization_name || 'this workspace'} and only shared according to the stated privacy policy.`,
    completionPageMessage: 'Thank you for completing the assessment.',
    postSubmitRedirectUrl: '',
    notifyOnSubmission: false,
    notifyOnReportReleased: false,
    notificationEmailAddress: account.email,
  } as const;

  return parseJson(account.settings_json, defaults);
}

export async function requireActiveCustomer(db: D1Database, accountId: number) {
  const account = await queryOne<CustomerAccountRow>(
    db,
    `SELECT id, full_name, email, account_type, organization_name, status, settings_json
     FROM customer_accounts
     WHERE id = ?
     LIMIT 1`,
    [accountId],
  );

  if (!account || account.status !== 'active') {
    throw new HTTPException(401, { message: 'Customer account is not active' });
  }

  return account;
}

export function requireWorkspaceRole(c: Context<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>, allowed: WorkspaceRole[], message = 'Workspace access is not allowed for this role') {
  const payload = c.get('customerPayload');
  if (!allowed.includes(payload.workspaceRole)) {
    throw new HTTPException(403, { message });
  }
  return payload;
}

export async function ensureWorkspaceSubscription(db: D1Database, account: Pick<CustomerAccountRow, 'id' | 'account_type' | 'email'>) {
  const existing = await queryOne<WorkspaceSubscriptionRow>(
    db,
    `SELECT id, customer_account_id, plan_code, status, billing_cycle, billing_provider,
            provider_customer_id, provider_subscription_id, provider_price_id,
            assessment_limit, participant_limit, team_member_limit,
            started_at, trial_ends_at, renews_at, current_period_start, current_period_end,
            cancel_at_period_end, canceled_at, past_due_at, suspended_at, plan_version, billing_contact_email
     FROM workspace_subscriptions
     WHERE customer_account_id = ?
     LIMIT 1`,
    [account.id],
  );

  if (existing) return existing;

  const defaultPlanCode = getDefaultPlanCode(account.account_type);
  const plan = workspacePlanCatalog[defaultPlanCode];
  const trialEndsAt = addDays(14);

  const result = await run(
    db,
    `INSERT INTO workspace_subscriptions (
       customer_account_id, plan_code, status, billing_cycle, billing_provider,
       assessment_limit, participant_limit, team_member_limit,
       started_at, trial_ends_at, renews_at, current_period_start, current_period_end,
       cancel_at_period_end, plan_version, billing_contact_email, created_at, updated_at
     ) VALUES (?, ?, 'trial', 'monthly', 'dummy', ?, ?, ?, CURRENT_TIMESTAMP, ?, NULL, NULL, NULL, 0, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [account.id, defaultPlanCode, plan.assessmentLimit, plan.participantLimit, plan.teamMemberLimit, trialEndsAt, account.email],
  );

  const id = Number(result.meta.last_row_id);
  const created = await queryOne<WorkspaceSubscriptionRow>(
    db,
    `SELECT id, customer_account_id, plan_code, status, billing_cycle, billing_provider,
            provider_customer_id, provider_subscription_id, provider_price_id,
            assessment_limit, participant_limit, team_member_limit,
            started_at, trial_ends_at, renews_at, current_period_start, current_period_end,
            cancel_at_period_end, canceled_at, past_due_at, suspended_at, plan_version, billing_contact_email
     FROM workspace_subscriptions
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (!created) {
    throw new HTTPException(500, { message: 'Workspace subscription could not be initialized' });
  }

  return created;
}

export async function fetchWorkspaceUsage(db: D1Database, accountId: number): Promise<WorkspaceUsageRow> {
  const assessmentRow = await queryOne<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count
     FROM customer_assessments
     WHERE customer_account_id = ?`,
    [accountId],
  );

  const participantRow = await queryOne<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count
     FROM customer_assessment_participants cap
     INNER JOIN customer_assessments ca ON ca.id = cap.customer_assessment_id
     WHERE ca.customer_account_id = ?`,
    [accountId],
  );

  const teamRow = await queryOne<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count
     FROM customer_workspace_members
     WHERE customer_account_id = ?`,
    [accountId],
  );

  return {
    activeAssessmentCount: Number(assessmentRow?.count ?? 0),
    participantRecordCount: Number(participantRow?.count ?? 0),
    teamSeatCount: Number(teamRow?.count ?? 0) + 1,
  };
}

export async function recordWorkspaceUsageEvent(db: D1Database, input: {
  customerAccountId: number;
  workspaceSubscriptionId: number | null;
  metricKey: 'assessment_created' | 'participant_added' | 'team_member_added' | 'result_exported';
  quantity?: number;
  referenceType?: string | null;
  referenceId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  await run(
    db,
    `INSERT INTO workspace_usage_events (
       customer_account_id, workspace_subscription_id, metric_key, quantity, reference_type, reference_id, metadata_json, occurred_at, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      input.customerAccountId,
      input.workspaceSubscriptionId,
      input.metricKey,
      input.quantity ?? 1,
      input.referenceType ?? null,
      input.referenceId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function syncWorkspaceUsageSnapshot(db: D1Database, customerAccountId: number, subscription: WorkspaceSubscriptionRow) {
  const usage = await fetchWorkspaceUsage(db, customerAccountId);
  const existing = await queryOne<{ id: number }>(
    db,
    `SELECT id
     FROM workspace_usage_snapshots
     WHERE customer_account_id = ?
       AND COALESCE(period_start, '') = COALESCE(?, '')
       AND COALESCE(period_end, '') = COALESCE(?, '')
     LIMIT 1`,
    [customerAccountId, subscription.current_period_start, subscription.current_period_end],
  );

  if (existing) {
    await run(
      db,
      `UPDATE workspace_usage_snapshots
       SET workspace_subscription_id = ?, assessment_count = ?, participant_count = ?, team_member_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [subscription.id, usage.activeAssessmentCount, usage.participantRecordCount, usage.teamSeatCount, existing.id],
    );
  } else {
    await run(
      db,
      `INSERT INTO workspace_usage_snapshots (
         customer_account_id, workspace_subscription_id, period_start, period_end,
         assessment_count, participant_count, team_member_count, export_count,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [customerAccountId, subscription.id, subscription.current_period_start, subscription.current_period_end, usage.activeAssessmentCount, usage.participantRecordCount, usage.teamSeatCount],
    );
  }

  return usage;
}

export function getPlanPrice(planCode: WorkspacePlanCode, billingCycle: WorkspaceBillingCycle) {
  const plan = workspacePlanCatalog[planCode];
  return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
}
