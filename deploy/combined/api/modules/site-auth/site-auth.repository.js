import { getDbPool } from '../../database/mysql.js';
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
const customerBaseSelect = `
  SELECT
    id,
    full_name,
    email,
    password_hash,
    account_type,
    organization_name,
    settings_json,
    status,
    last_login_at,
    session_version,
    created_at,
    updated_at
  FROM customer_accounts
`;
const workspaceMemberAuthSelect = `
  SELECT
    m.id,
    m.customer_account_id,
    m.full_name,
    m.email,
    m.password_hash,
    m.role,
    m.invitation_status,
    m.activation_token,
    m.activation_expires_at,
    m.activated_at,
    m.last_login_at,
    m.session_version,
    ca.account_type,
    ca.organization_name,
    ca.status AS customer_status
  FROM customer_workspace_members m
  INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
`;
export async function findCustomerByEmail(email) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${customerBaseSelect}
      WHERE email = ?
      LIMIT 1
    `, [normalizeEmail(email)]);
    return rows[0] ?? null;
}
export async function findCustomerById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${customerBaseSelect}
      WHERE id = ?
      LIMIT 1
    `, [id]);
    return rows[0] ?? null;
}
export async function findActiveCustomerById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${customerBaseSelect}
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `, [id]);
    return rows[0] ?? null;
}
export async function findActiveWorkspaceMemberByEmail(email) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${workspaceMemberAuthSelect}
      WHERE m.email = ?
        AND m.invitation_status = 'active'
        AND m.password_hash IS NOT NULL
        AND ca.status = 'active'
      LIMIT 1
    `, [normalizeEmail(email)]);
    return rows[0] ?? null;
}
export async function findActiveWorkspaceMemberById(customerAccountId, memberId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${workspaceMemberAuthSelect}
      WHERE m.customer_account_id = ?
        AND m.id = ?
        AND m.invitation_status = 'active'
        AND m.password_hash IS NOT NULL
        AND ca.status = 'active'
      LIMIT 1
    `, [customerAccountId, memberId]);
    return rows[0] ?? null;
}
export async function findWorkspaceMemberInviteByToken(token) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${workspaceMemberAuthSelect}
      WHERE m.activation_token = ?
        AND m.invitation_status = 'invited'
        AND ca.status = 'active'
      LIMIT 1
    `, [token]);
    return rows[0] ?? null;
}
export async function createCustomerAccount(input) {
    const pool = getDbPool();
    const [result] = await pool.query(`
      INSERT INTO customer_accounts (
        full_name,
        email,
        password_hash,
        account_type,
        organization_name,
        settings_json,
        status,
        last_login_at,
        session_version
      )
      VALUES (?, ?, ?, ?, ?, NULL, 'active', NOW(), 1)
    `, [
        input.fullName.trim(),
        normalizeEmail(input.email),
        input.passwordHash,
        input.accountType,
        input.organizationName.trim(),
    ]);
    return findCustomerById(result.insertId);
}
export async function markCustomerLogin(id) {
    const pool = getDbPool();
    await pool.query('UPDATE customer_accounts SET last_login_at = NOW() WHERE id = ?', [id]);
}
export async function markWorkspaceMemberLogin(customerAccountId, memberId) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE customer_workspace_members
      SET last_login_at = NOW()
      WHERE customer_account_id = ?
        AND id = ?
    `, [customerAccountId, memberId]);
}
export async function revokeCustomerSessions(id) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE customer_accounts
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
}
export async function revokeWorkspaceMemberSessions(customerAccountId, memberId) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE customer_workspace_members
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_account_id = ?
        AND id = ?
    `, [customerAccountId, memberId]);
}
export async function updateCustomerOrganizationName(id, organizationName) {
    const pool = getDbPool();
    await pool.query('UPDATE customer_accounts SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [organizationName.trim(), id]);
}
export async function activateWorkspaceMemberInvite(input) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE customer_workspace_members
      SET full_name = ?,
          password_hash = ?,
          invitation_status = 'active',
          activation_token = NULL,
          activation_expires_at = NULL,
          activated_at = CURRENT_TIMESTAMP,
          last_login_at = CURRENT_TIMESTAMP,
          session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_account_id = ?
        AND id = ?
        AND invitation_status = 'invited'
    `, [
        input.fullName.trim(),
        input.passwordHash,
        input.customerAccountId,
        input.memberId,
    ]);
    return findActiveWorkspaceMemberById(input.customerAccountId, input.memberId);
}
