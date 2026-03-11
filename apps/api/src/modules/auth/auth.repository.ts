import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

interface AdminRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'inactive';
}

export async function findAdminByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<AdminRow[]>(
    `
      SELECT id, full_name, email, password_hash, role, status
      FROM admins
      WHERE email = ?
      LIMIT 1
    `,
    [email.trim().toLowerCase()],
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
