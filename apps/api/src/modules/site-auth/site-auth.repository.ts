import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

export interface CustomerAccountRecord {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
  settings_json: string | null;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  session_version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface WorkspaceMemberAuthRecord {
  id: number;
  customer_account_id: number;
  full_name: string;
  email: string;
  password_hash: string | null;
  role: 'admin' | 'operator' | 'reviewer';
  invitation_status: 'active' | 'invited';
  activation_token: string | null;
  activation_expires_at: string | null;
  activated_at: string | null;
  last_login_at: string | null;
  session_version: number;
  account_type: 'business' | 'researcher';
  organization_name: string;
  customer_status: 'active' | 'inactive';
}

interface CustomerAccountRow extends RowDataPacket, CustomerAccountRecord {}
interface WorkspaceMemberAuthRow extends RowDataPacket, WorkspaceMemberAuthRecord {}

function normalizeEmail(email: string) {
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

export async function findCustomerByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAccountRow[]>(
    `${customerBaseSelect}
      WHERE email = ?
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return rows[0] ?? null;
}

export async function findCustomerById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAccountRow[]>(
    `${customerBaseSelect}
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
}

export async function findActiveCustomerById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAccountRow[]>(
    `${customerBaseSelect}
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
}

export async function findActiveWorkspaceMemberByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceMemberAuthRow[]>(
    `${workspaceMemberAuthSelect}
      WHERE m.email = ?
        AND m.invitation_status = 'active'
        AND m.password_hash IS NOT NULL
        AND ca.status = 'active'
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return rows[0] ?? null;
}

export async function findActiveWorkspaceMemberById(customerAccountId: number, memberId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceMemberAuthRow[]>(
    `${workspaceMemberAuthSelect}
      WHERE m.customer_account_id = ?
        AND m.id = ?
        AND m.invitation_status = 'active'
        AND m.password_hash IS NOT NULL
        AND ca.status = 'active'
      LIMIT 1
    `,
    [customerAccountId, memberId],
  );

  return rows[0] ?? null;
}

export async function findWorkspaceMemberInviteByToken(token: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<WorkspaceMemberAuthRow[]>(
    `${workspaceMemberAuthSelect}
      WHERE m.activation_token = ?
        AND m.invitation_status = 'invited'
        AND ca.status = 'active'
      LIMIT 1
    `,
    [token],
  );

  return rows[0] ?? null;
}

export async function createCustomerAccount(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  accountType: 'business' | 'researcher';
  organizationName: string;
}) {
  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
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
    `,
    [
      input.fullName.trim(),
      normalizeEmail(input.email),
      input.passwordHash,
      input.accountType,
      input.organizationName.trim(),
    ],
  );

  return findCustomerById(result.insertId);
}

export async function markCustomerLogin(id: number) {
  const pool = getDbPool();
  await pool.query(
    'UPDATE customer_accounts SET last_login_at = NOW() WHERE id = ?',
    [id],
  );
}

export async function markWorkspaceMemberLogin(customerAccountId: number, memberId: number) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE customer_workspace_members
      SET last_login_at = NOW()
      WHERE customer_account_id = ?
        AND id = ?
    `,
    [customerAccountId, memberId],
  );
}

export async function revokeCustomerSessions(id: number) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      UPDATE customer_accounts
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [id],
  );
}

export async function revokeWorkspaceMemberSessions(customerAccountId: number, memberId: number) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      UPDATE customer_workspace_members
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_account_id = ?
        AND id = ?
    `,
    [customerAccountId, memberId],
  );
}

export async function updateCustomerOrganizationName(id: number, organizationName: string) {
  const pool = getDbPool();
  await pool.query(
    'UPDATE customer_accounts SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [organizationName.trim(), id],
  );
}

export async function activateWorkspaceMemberInvite(input: {
  customerAccountId: number;
  memberId: number;
  fullName: string;
  passwordHash: string;
}) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
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
    `,
    [
      input.fullName.trim(),
      input.passwordHash,
      input.customerAccountId,
      input.memberId,
    ],
  );

  return findActiveWorkspaceMemberById(input.customerAccountId, input.memberId);
}
