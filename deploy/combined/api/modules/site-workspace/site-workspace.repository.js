import { getDbPool } from '../../database/mysql.js';
function toIsoString(value) {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function normalizeJson(value) {
    if (!value) {
        return {};
    }
    try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed ? parsed : {};
    }
    catch {
        return {};
    }
}
function mapWorkspaceMember(row) {
    return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        status: row.invitation_status,
        source: 'workspace_member',
        invitedAt: toIsoString(row.invited_at),
        lastNotifiedAt: toIsoString(row.last_notified_at),
        activatedAt: toIsoString(row.activated_at),
        activationExpiresAt: toIsoString(row.activation_expires_at),
        lastLoginAt: toIsoString(row.last_login_at),
    };
}
function mapWorkspaceActivity(row) {
    return {
        id: row.id,
        actorType: row.actor_type,
        actorAdminId: row.actor_admin_id,
        actorName: row.actor_name,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        metadata: normalizeJson(row.metadata_json),
        createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    };
}
export async function updateCustomerWorkspaceRecord(input) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE customer_accounts
      SET organization_name = ?,
          settings_json = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [input.organizationName.trim(), input.settingsJson, input.customerAccountId]);
}
export async function fetchCustomerWorkspaceMembers(customerAccountId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
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
    `, [customerAccountId]);
    return rows.map(mapWorkspaceMember);
}
export async function fetchCustomerWorkspaceActivity(customerAccountId, limit = 20) {
    const pool = getDbPool();
    const safeLimit = Math.max(1, Math.min(limit, 60));
    const [rows] = await pool.query(`
      SELECT
        al.id,
        al.actor_type,
        al.actor_admin_id,
        al.entity_type,
        al.entity_id,
        al.action,
        al.metadata_json,
        al.created_at,
        a.full_name AS actor_name
      FROM audit_logs al
      LEFT JOIN admins a ON a.id = al.actor_admin_id
      WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(al.metadata_json, '$.customerAccountId')) AS UNSIGNED) = ?
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT ${safeLimit}
    `, [customerAccountId]);
    return rows.map(mapWorkspaceActivity);
}
export async function findCustomerWorkspaceMemberById(input) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
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
    `, [input.customerAccountId, input.memberId]);
    return rows[0] ? mapWorkspaceMember(rows[0]) : null;
}
export async function upsertCustomerWorkspaceMember(input) {
    const pool = getDbPool();
    await pool.query(`
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
    `, [
        input.customerAccountId,
        input.fullName.trim(),
        normalizeEmail(input.email),
        input.role,
    ]);
    const members = await fetchCustomerWorkspaceMembers(input.customerAccountId);
    return members.find((member) => member.email === normalizeEmail(input.email)) ?? null;
}
export async function issueCustomerWorkspaceMemberInvite(input) {
    const pool = getDbPool();
    const [result] = await pool.query(`
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
    `, [
        input.activationToken,
        input.activationExpiresAt,
        input.memberId,
        input.customerAccountId,
    ]);
    if (result.affectedRows === 0) {
        return null;
    }
    return findCustomerWorkspaceMemberById({
        customerAccountId: input.customerAccountId,
        memberId: input.memberId,
    });
}
export async function markCustomerWorkspaceMemberNotified(input) {
    const pool = getDbPool();
    const [result] = await pool.query(`
      UPDATE customer_workspace_members
      SET last_notified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_account_id = ?
        AND invitation_status = 'active'
    `, [input.memberId, input.customerAccountId]);
    if (result.affectedRows === 0) {
        return null;
    }
    return findCustomerWorkspaceMemberById({
        customerAccountId: input.customerAccountId,
        memberId: input.memberId,
    });
}
