import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

interface WorkspaceMemberRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'operator' | 'reviewer';
  invitation_status: 'active' | 'invited';
  invited_at: string | Date | null;
  last_notified_at: string | Date | null;
  activation_expires_at: string | Date | null;
  activated_at: string | Date | null;
  last_login_at: string | Date | null;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapWorkspaceMember(row: WorkspaceMemberRow) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.invitation_status,
    source: 'workspace_member' as const,
    invitedAt: toIsoString(row.invited_at),
    lastNotifiedAt: toIsoString(row.last_notified_at),
    activatedAt: toIsoString(row.activated_at),
    activationExpiresAt: toIsoString(row.activation_expires_at),
    lastLoginAt: toIsoString(row.last_login_at),
  };
}

export async function updateCustomerWorkspaceRecord(input: {
  customerAccountId: number;
  organizationName: string;
  settingsJson: string;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE customer_accounts
      SET organization_name = ?,
          settings_json = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.organizationName.trim(), input.settingsJson, input.customerAccountId],
  );
}

export async function fetchCustomerWorkspaceMembers(customerAccountId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceMemberRow[]>(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        invitation_status,
        invited_at,
        last_notified_at,
        activation_expires_at,
        activated_at,
        last_login_at
      FROM customer_workspace_members
      WHERE customer_account_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [customerAccountId],
  );

  return rows.map(mapWorkspaceMember);
}

export async function findCustomerWorkspaceMemberById(input: {
  customerAccountId: number;
  memberId: number;
}) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceMemberRow[]>(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        invitation_status,
        invited_at,
        last_notified_at,
        activation_expires_at,
        activated_at,
        last_login_at
      FROM customer_workspace_members
      WHERE customer_account_id = ?
        AND id = ?
      LIMIT 1
    `,
    [input.customerAccountId, input.memberId],
  );

  return rows[0] ? mapWorkspaceMember(rows[0]) : null;
}

export async function upsertCustomerWorkspaceMember(input: {
  customerAccountId: number;
  fullName: string;
  email: string;
  role: 'admin' | 'operator' | 'reviewer';
}) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      INSERT INTO customer_workspace_members (
        customer_account_id,
        full_name,
        email,
        role,
        invitation_status,
        session_version
      )
      VALUES (?, ?, ?, ?, 'invited', 1)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      input.customerAccountId,
      input.fullName.trim(),
      normalizeEmail(input.email),
      input.role,
    ],
  );

  const members = await fetchCustomerWorkspaceMembers(input.customerAccountId);
  return members.find((member) => member.email === normalizeEmail(input.email)) ?? null;
}

export async function issueCustomerWorkspaceMemberInvite(input: {
  customerAccountId: number;
  memberId: number;
  activationToken: string;
  activationExpiresAt: string;
}) {
  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE customer_workspace_members
      SET invitation_status = 'invited',
          activation_token = ?,
          activation_expires_at = ?,
          invited_at = COALESCE(invited_at, CURRENT_TIMESTAMP),
          last_notified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_account_id = ?
        AND invitation_status = 'invited'
    `,
    [
      input.activationToken,
      input.activationExpiresAt,
      input.memberId,
      input.customerAccountId,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findCustomerWorkspaceMemberById({
    customerAccountId: input.customerAccountId,
    memberId: input.memberId,
  });
}

export async function markCustomerWorkspaceMemberNotified(input: {
  customerAccountId: number;
  memberId: number;
}) {
  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE customer_workspace_members
      SET last_notified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_account_id = ?
        AND invitation_status = 'active'
    `,
    [input.memberId, input.customerAccountId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findCustomerWorkspaceMemberById({
    customerAccountId: input.customerAccountId,
    memberId: input.memberId,
  });
}
