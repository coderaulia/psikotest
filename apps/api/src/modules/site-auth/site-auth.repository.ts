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

interface CustomerAccountRow extends RowDataPacket, CustomerAccountRecord {}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const baseSelect = `
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

export async function findCustomerByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAccountRow[]>(
    `${baseSelect}
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
    `${baseSelect}
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
    `${baseSelect}
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [id],
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

export async function updateCustomerOrganizationName(id: number, organizationName: string) {
  const pool = getDbPool();
  await pool.query(
    'UPDATE customer_accounts SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [organizationName.trim(), id],
  );
}
