import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

export type WorkspacePlanCode = 'starter' | 'growth' | 'research';
export type WorkspaceSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended';
export type WorkspaceBillingCycle = 'monthly' | 'annual';

interface WorkspaceSubscriptionRow extends RowDataPacket {
  id: number;
  customer_account_id: number;
  plan_code: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billing_cycle: WorkspaceBillingCycle;
  assessment_limit: number;
  participant_limit: number;
  team_member_limit: number;
  started_at: string | Date;
  trial_ends_at: string | Date | null;
  renews_at: string | Date | null;
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

function mapWorkspaceSubscription(row: WorkspaceSubscriptionRow) {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    planCode: row.plan_code,
    status: row.status,
    billingCycle: row.billing_cycle,
    assessmentLimit: row.assessment_limit,
    participantLimit: row.participant_limit,
    teamMemberLimit: row.team_member_limit,
    startedAt: toIsoString(row.started_at) ?? new Date().toISOString(),
    trialEndsAt: toIsoString(row.trial_ends_at),
    renewsAt: toIsoString(row.renews_at),
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
        assessment_limit,
        participant_limit,
        team_member_limit,
        started_at,
        trial_ends_at,
        renews_at
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
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  trialEndsAt: string | null;
  renewsAt: string | null;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO workspace_subscriptions (
        customer_account_id,
        plan_code,
        status,
        billing_cycle,
        assessment_limit,
        participant_limit,
        team_member_limit,
        trial_ends_at,
        renews_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.customerAccountId,
      input.planCode,
      input.status,
      input.billingCycle,
      input.assessmentLimit,
      input.participantLimit,
      input.teamMemberLimit,
      input.trialEndsAt,
      input.renewsAt,
    ],
  );

  return fetchWorkspaceSubscription(input.customerAccountId);
}

export async function updateWorkspaceSubscription(input: {
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billingCycle: WorkspaceBillingCycle;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  trialEndsAt: string | null;
  renewsAt: string | null;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE workspace_subscriptions
      SET plan_code = ?,
          status = ?,
          billing_cycle = ?,
          assessment_limit = ?,
          participant_limit = ?,
          team_member_limit = ?,
          trial_ends_at = ?,
          renews_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_account_id = ?
    `,
    [
      input.planCode,
      input.status,
      input.billingCycle,
      input.assessmentLimit,
      input.participantLimit,
      input.teamMemberLimit,
      input.trialEndsAt,
      input.renewsAt,
      input.customerAccountId,
    ],
  );

  return fetchWorkspaceSubscription(input.customerAccountId);
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
