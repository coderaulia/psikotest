import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

interface AdminRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
  status: 'active' | 'inactive';
  session_version: number;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findAdminByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<AdminRow[]>(
    `
      SELECT id, full_name, email, password_hash, role, status, session_version
      FROM admins
      WHERE email = ?
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return rows[0] ?? null;
}

export async function findActiveAdminById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<AdminRow[]>(
    `
      SELECT id, full_name, email, password_hash, role, status, session_version
      FROM admins
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
}

export async function markAdminLogin(adminId: number) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE admins
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [adminId],
  );
}

export async function revokeAdminSessions(adminId: number) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      UPDATE admins
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [adminId],
  );
}
