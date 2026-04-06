import { getDbPool } from '../../database/mysql.js';
function toIsoString(value) {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
export async function fetchParticipants(filters = {}) {
    const pool = getDbPool();
    const conditions = [];
    const params = [];
    const search = filters.search?.trim();
    if (search) {
        const like = `%${search}%`;
        conditions.push('(p.full_name LIKE ? OR p.email LIKE ? OR COALESCE(p.department, \'\') LIKE ? OR COALESCE(p.position_title, \'\') LIKE ?)');
        params.push(like, like, like, like);
    }
    if (filters.testType) {
        conditions.push('latest_tt.code = ?');
        params.push(filters.testType);
    }
    if (filters.status) {
        conditions.push("COALESCE(latest_s.status, 'not_started') = ?");
        params.push(filters.status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.employee_code,
        p.department,
        p.position_title,
        latest_tt.code AS latest_test_type,
        latest_s.status AS latest_status,
        (
          SELECT COUNT(*)
          FROM submissions all_s
          WHERE all_s.participant_id = p.id
        ) AS total_submissions,
        COALESCE(latest_s.submitted_at, latest_s.started_at, latest_s.updated_at, p.updated_at) AS last_activity_at
      FROM participants p
      LEFT JOIN submissions latest_s ON latest_s.id = (
        SELECT s1.id
        FROM submissions s1
        WHERE s1.participant_id = p.id
        ORDER BY COALESCE(s1.submitted_at, s1.started_at, s1.created_at) DESC, s1.id DESC
        LIMIT 1
      )
      LEFT JOIN test_sessions latest_ts ON latest_ts.id = latest_s.test_session_id
      LEFT JOIN test_types latest_tt ON latest_tt.id = latest_ts.test_type_id
      ${whereClause}
      ORDER BY COALESCE(latest_s.submitted_at, latest_s.started_at, latest_s.updated_at, p.updated_at) DESC, p.id DESC
      LIMIT 200
    `, params);
    return rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        employeeCode: row.employee_code,
        department: row.department,
        positionTitle: row.position_title,
        latestTestType: row.latest_test_type,
        latestStatus: row.latest_status ?? 'not_started',
        totalSubmissions: Number(row.total_submissions ?? 0),
        lastActivityAt: toIsoString(row.last_activity_at),
    }));
}
