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
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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
        last_notified_at
      FROM customer_workspace_members
      WHERE customer_account_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [customerAccountId],
  );

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.invitation_status,
    source: 'workspace_member' as const,
    invitedAt: toIsoString(row.invited_at),
    lastNotifiedAt: toIsoString(row.last_notified_at),
  }));
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
        invitation_status
      )
      VALUES (?, ?, ?, ?, 'invited')
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      input.customerAccountId,
      input.fullName.trim(),
      input.email.trim().toLowerCase(),
      input.role,
    ],
  );

  const members = await fetchCustomerWorkspaceMembers(input.customerAccountId);
  return members.find((member) => member.email === input.email.trim().toLowerCase()) ?? null;
}

export async function markCustomerWorkspaceMemberInvited(input: {
  customerAccountId: number;
  memberId: number;
}) {
  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE customer_workspace_members
      SET invitation_status = 'invited',
          invited_at = COALESCE(invited_at, CURRENT_TIMESTAMP),
          last_notified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_account_id = ?
    `,
    [input.memberId, input.customerAccountId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const members = await fetchCustomerWorkspaceMembers(input.customerAccountId);
  return members.find((member) => member.id === input.memberId) ?? null;
}
