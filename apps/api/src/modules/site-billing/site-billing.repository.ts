import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

export type WorkspacePlanCode = 'starter' | 'growth' | 'research';
export type WorkspaceSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended';
export type WorkspaceBillingCycle = 'monthly' | 'annual';
export type WorkspaceBillingProvider = 'dummy' | 'manual' | 'stripe';
export type BillingCheckoutSessionStatus = 'open' | 'completed' | 'expired' | 'failed';
export type BillingInvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

interface WorkspaceSubscriptionRow extends RowDataPacket {
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
  started_at: string | Date;
  trial_ends_at: string | Date | null;
  renews_at: string | Date | null;
  current_period_start: string | Date | null;
  current_period_end: string | Date | null;
  cancel_at_period_end: number;
  canceled_at: string | Date | null;
  past_due_at: string | Date | null;
  suspended_at: string | Date | null;
  plan_version: number;
  billing_contact_email: string | null;
}

interface BillingCheckoutSessionRow extends RowDataPacket {
  id: number;
  customer_account_id: number;
  workspace_subscription_id: number;
  session_key: string;
  billing_provider: WorkspaceBillingProvider;
  plan_code: WorkspacePlanCode;
  billing_cycle: WorkspaceBillingCycle;
  status: BillingCheckoutSessionStatus;
  checkout_url: string | null;
  expires_at: string | Date | null;
  completed_at: string | Date | null;
  metadata_json: string | null;
  created_at: string | Date;
}

interface BillingInvoiceRow extends RowDataPacket {
  id: number;
  customer_account_id: number;
  workspace_subscription_id: number;
  checkout_session_id: number | null;
  external_invoice_id: string | null;
  invoice_number: string | null;
  status: BillingInvoiceStatus;
  currency_code: string;
  amount_subtotal: number;
  amount_total: number;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  issued_at: string | Date | null;
  due_at: string | Date | null;
  paid_at: string | Date | null;
  metadata_json: string | null;
  created_at: string | Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJson<T>(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapWorkspaceSubscription(row: WorkspaceSubscriptionRow) {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    planCode: row.plan_code,
    status: row.status,
    billingCycle: row.billing_cycle,
    billingProvider: row.billing_provider,
    providerCustomerId: row.provider_customer_id,
    providerSubscriptionId: row.provider_subscription_id,
    providerPriceId: row.provider_price_id,
    assessmentLimit: row.assessment_limit,
    participantLimit: row.participant_limit,
    teamMemberLimit: row.team_member_limit,
    startedAt: toIsoString(row.started_at) ?? new Date().toISOString(),
    trialEndsAt: toIsoString(row.trial_ends_at),
    renewsAt: toIsoString(row.renews_at),
    currentPeriodStart: toIsoString(row.current_period_start),
    currentPeriodEnd: toIsoString(row.current_period_end),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    canceledAt: toIsoString(row.canceled_at),
    pastDueAt: toIsoString(row.past_due_at),
    suspendedAt: toIsoString(row.suspended_at),
    planVersion: row.plan_version,
    billingContactEmail: row.billing_contact_email,
  };
}

function mapBillingCheckoutSession(row: BillingCheckoutSessionRow) {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    workspaceSubscriptionId: row.workspace_subscription_id,
    sessionKey: row.session_key,
    billingProvider: row.billing_provider,
    planCode: row.plan_code,
    billingCycle: row.billing_cycle,
    status: row.status,
    checkoutUrl: row.checkout_url,
    expiresAt: toIsoString(row.expires_at),
    completedAt: toIsoString(row.completed_at),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json) ?? {},
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
  };
}

function mapBillingInvoice(row: BillingInvoiceRow) {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    workspaceSubscriptionId: row.workspace_subscription_id,
    checkoutSessionId: row.checkout_session_id,
    externalInvoiceId: row.external_invoice_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    currencyCode: row.currency_code,
    amountSubtotal: Number(row.amount_subtotal),
    amountTotal: Number(row.amount_total),
    hostedInvoiceUrl: row.hosted_invoice_url,
    invoicePdfUrl: row.invoice_pdf_url,
    issuedAt: toIsoString(row.issued_at),
    dueAt: toIsoString(row.due_at),
    paidAt: toIsoString(row.paid_at),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json) ?? {},
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
  };
}

export async function fetchWorkspaceSubscription(customerAccountId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceSubscriptionRow[]>(
    `
      SELECT
        id,
        customer_account_id,
        plan_code,
        status,
        billing_cycle,
        billing_provider,
        provider_customer_id,
        provider_subscription_id,
        provider_price_id,
        assessment_limit,
        participant_limit,
        team_member_limit,
        started_at,
        trial_ends_at,
        renews_at,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        past_due_at,
        suspended_at,
        plan_version,
        billing_contact_email
      FROM workspace_subscriptions
      WHERE customer_account_id = ?
      LIMIT 1
    `,
    [customerAccountId],
  );

  const row = rows[0];
  return row ? mapWorkspaceSubscription(row) : null;
}

export async function insertWorkspaceSubscription(input: {
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billingCycle: WorkspaceBillingCycle;
  billingProvider: WorkspaceBillingProvider;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  trialEndsAt: string | null;
  renewsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  pastDueAt: string | null;
  suspendedAt: string | null;
  planVersion: number;
  billingContactEmail: string | null;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO workspace_subscriptions (
        customer_account_id,
        plan_code,
        status,
        billing_cycle,
        billing_provider,
        provider_customer_id,
        provider_subscription_id,
        provider_price_id,
        assessment_limit,
        participant_limit,
        team_member_limit,
        trial_ends_at,
        renews_at,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        past_due_at,
        suspended_at,
        plan_version,
        billing_contact_email
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.customerAccountId,
      input.planCode,
      input.status,
      input.billingCycle,
      input.billingProvider,
      input.providerCustomerId,
      input.providerSubscriptionId,
      input.providerPriceId,
      input.assessmentLimit,
      input.participantLimit,
      input.teamMemberLimit,
      input.trialEndsAt,
      input.renewsAt,
      input.currentPeriodStart,
      input.currentPeriodEnd,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.canceledAt,
      input.pastDueAt,
      input.suspendedAt,
      input.planVersion,
      input.billingContactEmail,
    ],
  );

  return fetchWorkspaceSubscription(input.customerAccountId);
}

export async function updateWorkspaceSubscription(input: {
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billingCycle: WorkspaceBillingCycle;
  billingProvider: WorkspaceBillingProvider;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  trialEndsAt: string | null;
  renewsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  pastDueAt: string | null;
  suspendedAt: string | null;
  planVersion: number;
  billingContactEmail: string | null;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE workspace_subscriptions
      SET plan_code = ?,
          status = ?,
          billing_cycle = ?,
          billing_provider = ?,
          provider_customer_id = ?,
          provider_subscription_id = ?,
          provider_price_id = ?,
          assessment_limit = ?,
          participant_limit = ?,
          team_member_limit = ?,
          trial_ends_at = ?,
          renews_at = ?,
          current_period_start = ?,
          current_period_end = ?,
          cancel_at_period_end = ?,
          canceled_at = ?,
          past_due_at = ?,
          suspended_at = ?,
          plan_version = ?,
          billing_contact_email = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_account_id = ?
    `,
    [
      input.planCode,
      input.status,
      input.billingCycle,
      input.billingProvider,
      input.providerCustomerId,
      input.providerSubscriptionId,
      input.providerPriceId,
      input.assessmentLimit,
      input.participantLimit,
      input.teamMemberLimit,
      input.trialEndsAt,
      input.renewsAt,
      input.currentPeriodStart,
      input.currentPeriodEnd,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.canceledAt,
      input.pastDueAt,
      input.suspendedAt,
      input.planVersion,
      input.billingContactEmail,
      input.customerAccountId,
    ],
  );

  return fetchWorkspaceSubscription(input.customerAccountId);
}

export async function createBillingCheckoutSession(input: {
  customerAccountId: number;
  workspaceSubscriptionId: number;
  billingProvider: WorkspaceBillingProvider;
  planCode: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
  status: BillingCheckoutSessionStatus;
  checkoutUrl: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}) {
  const pool = getDbPool();
  const sessionKey = `chk_${input.customerAccountId}_${Date.now()}`;
  const metadataJson = JSON.stringify(input.metadata ?? {});
  const [result] = await pool.query(
    `
      INSERT INTO billing_checkout_sessions (
        customer_account_id,
        workspace_subscription_id,
        session_key,
        billing_provider,
        plan_code,
        billing_cycle,
        status,
        checkout_url,
        expires_at,
        completed_at,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.customerAccountId,
      input.workspaceSubscriptionId,
      sessionKey,
      input.billingProvider,
      input.planCode,
      input.billingCycle,
      input.status,
      input.checkoutUrl,
      input.expiresAt,
      input.completedAt,
      metadataJson,
    ],
  );

  const checkoutSessionId = Number((result as { insertId?: number }).insertId ?? 0);
  const [rows] = await pool.query<BillingCheckoutSessionRow[]>(
    `
      SELECT
        id,
        customer_account_id,
        workspace_subscription_id,
        session_key,
        billing_provider,
        plan_code,
        billing_cycle,
        status,
        checkout_url,
        expires_at,
        completed_at,
        metadata_json,
        created_at
      FROM billing_checkout_sessions
      WHERE id = ?
      LIMIT 1
    `,
    [checkoutSessionId],
  );

  return rows[0] ? mapBillingCheckoutSession(rows[0]) : null;
}

export async function fetchBillingCheckoutSessions(customerAccountId: number, limit = 5) {
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const [rows] = await pool.query<BillingCheckoutSessionRow[]>(
    `
      SELECT
        id,
        customer_account_id,
        workspace_subscription_id,
        session_key,
        billing_provider,
        plan_code,
        billing_cycle,
        status,
        checkout_url,
        expires_at,
        completed_at,
        metadata_json,
        created_at
      FROM billing_checkout_sessions
      WHERE customer_account_id = ?
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `,
    [customerAccountId],
  );

  return rows.map(mapBillingCheckoutSession);
}

export async function createBillingInvoice(input: {
  customerAccountId: number;
  workspaceSubscriptionId: number;
  checkoutSessionId: number | null;
  externalInvoiceId: string | null;
  invoiceNumber: string | null;
  status: BillingInvoiceStatus;
  currencyCode: string;
  amountSubtotal: number;
  amountTotal: number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown>;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO billing_invoices (
        customer_account_id,
        workspace_subscription_id,
        checkout_session_id,
        external_invoice_id,
        invoice_number,
        status,
        currency_code,
        amount_subtotal,
        amount_total,
        hosted_invoice_url,
        invoice_pdf_url,
        issued_at,
        due_at,
        paid_at,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.customerAccountId,
      input.workspaceSubscriptionId,
      input.checkoutSessionId,
      input.externalInvoiceId,
      input.invoiceNumber,
      input.status,
      input.currencyCode,
      input.amountSubtotal,
      input.amountTotal,
      input.hostedInvoiceUrl,
      input.invoicePdfUrl,
      input.issuedAt,
      input.dueAt,
      input.paidAt,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function fetchBillingInvoices(customerAccountId: number, limit = 10) {
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const [rows] = await pool.query<BillingInvoiceRow[]>(
    `
      SELECT
        id,
        customer_account_id,
        workspace_subscription_id,
        checkout_session_id,
        external_invoice_id,
        invoice_number,
        status,
        currency_code,
        amount_subtotal,
        amount_total,
        hosted_invoice_url,
        invoice_pdf_url,
        issued_at,
        due_at,
        paid_at,
        metadata_json,
        created_at
      FROM billing_invoices
      WHERE customer_account_id = ?
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `,
    [customerAccountId],
  );

  return rows.map(mapBillingInvoice);
}

export async function recordWorkspaceUsageEvent(input: {
  customerAccountId: number;
  workspaceSubscriptionId: number | null;
  metricKey: 'assessment_created' | 'participant_added' | 'team_member_added' | 'result_exported';
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  metadata: Record<string, unknown>;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO workspace_usage_events (
        customer_account_id,
        workspace_subscription_id,
        metric_key,
        quantity,
        reference_type,
        reference_id,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.customerAccountId,
      input.workspaceSubscriptionId,
      input.metricKey,
      input.quantity,
      input.referenceType,
      input.referenceId,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function upsertWorkspaceUsageSnapshot(input: {
  customerAccountId: number;
  workspaceSubscriptionId: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  assessmentCount: number;
  participantCount: number;
  teamMemberCount: number;
  exportCount: number;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO workspace_usage_snapshots (
        customer_account_id,
        workspace_subscription_id,
        period_start,
        period_end,
        assessment_count,
        participant_count,
        team_member_count,
        export_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        workspace_subscription_id = VALUES(workspace_subscription_id),
        assessment_count = VALUES(assessment_count),
        participant_count = VALUES(participant_count),
        team_member_count = VALUES(team_member_count),
        export_count = VALUES(export_count),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      input.customerAccountId,
      input.workspaceSubscriptionId,
      input.periodStart,
      input.periodEnd,
      input.assessmentCount,
      input.participantCount,
      input.teamMemberCount,
      input.exportCount,
    ],
  );
}

export async function fetchWorkspaceUsage(customerAccountId: number) {
  const pool = getDbPool();
  const [assessmentRows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM customer_assessments ca
      INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
      WHERE ca.customer_account_id = ?
        AND ts.status IN ('draft', 'active')
    `,
    [customerAccountId],
  );

  const [participantRows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM customer_assessment_participants cap
      INNER JOIN customer_assessments ca ON ca.id = cap.customer_assessment_id
      WHERE ca.customer_account_id = ?
    `,
    [customerAccountId],
  );

  const [teamRows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM customer_workspace_members
      WHERE customer_account_id = ?
    `,
    [customerAccountId],
  );

  return {
    activeAssessmentCount: Number(assessmentRows[0]?.total ?? 0),
    participantRecordCount: Number(participantRows[0]?.total ?? 0),
    teamSeatCount: Number(teamRows[0]?.total ?? 0) + 1,
  };
}
