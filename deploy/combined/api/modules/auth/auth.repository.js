import { getDbPool } from '../../database/mysql.js';
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export async function findAdminByEmail(email) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT id, full_name, email, password_hash, role, status, session_version
      FROM admins
      WHERE email = ?
      LIMIT 1
    `, [normalizeEmail(email)]);
    return rows[0] ?? null;
}
export async function findActiveAdminById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT id, full_name, email, password_hash, role, status, session_version
      FROM admins
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `, [id]);
    return rows[0] ?? null;
}
export async function markAdminLogin(adminId) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE admins
      SET last_login_at = NOW()
      WHERE id = ?
    `, [adminId]);
}
export async function revokeAdminSessions(adminId) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE admins
      SET session_version = session_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [adminId]);
}
export async function listReviewerAdmins() {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT id, full_name, email, password_hash, role, status, session_version
      FROM admins
      WHERE status = 'active'
        AND role IN ('super_admin', 'psychologist_reviewer')
      ORDER BY CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, full_name ASC, id ASC
    `);
    return rows;
}
