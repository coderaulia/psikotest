import { randomBytes } from 'node:crypto';
import { getDbPool } from '../../database/mysql.js';
import { parseTestSessionSettings, } from './session-settings.js';
function toIsoString(value) {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function parseInstructions(instructions) {
    return (instructions ?? '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}
function parseReviewStatus(payload) {
    if (!payload) {
        return 'scored_preliminary';
    }
    const normalized = typeof payload === 'string'
        ? JSON.parse(payload)
        : payload;
    if (typeof normalized.releasedAt === 'string' && normalized.releasedAt.length > 0) {
        return 'released';
    }
    if (normalized.reviewStatus === 'released') {
        return 'released';
    }
    if (normalized.reviewStatus === 'reviewed') {
        return 'reviewed';
    }
    if (normalized.reviewStatus === 'in_review') {
        return 'in_review';
    }
    return 'scored_preliminary';
}
function mapSessionSummary(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        testType: row.test_type,
        status: row.status,
        accessToken: row.access_token,
        participantCount: Number(row.participant_count ?? 0),
        completedCount: Number(row.completed_count ?? 0),
        startsAt: toIsoString(row.starts_at),
        endsAt: toIsoString(row.ends_at),
        timeLimitMinutes: row.time_limit_minutes,
        settings: parseTestSessionSettings(row.settings_json),
    };
}
function slugify(value) {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 42);
    return slug || 'session';
}
function createAccessToken(testType, title) {
    const suffix = randomBytes(3).toString('hex');
    return `${testType}-${slugify(title)}-${suffix}`.slice(0, 80);
}
function buildSummaryQuery(filters = {}) {
    const conditions = [];
    const params = [];
    const search = filters.search?.trim();
    if (search) {
        const like = `%${search}%`;
        conditions.push('(ts.title LIKE ? OR COALESCE(ts.description, \"\") LIKE ? OR ts.access_token LIKE ?)');
        params.push(like, like, like);
    }
    if (filters.testType) {
        conditions.push('tt.code = ?');
        params.push(filters.testType);
    }
    if (filters.status) {
        conditions.push('ts.status = ?');
        params.push(filters.status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ? `LIMIT ${Math.max(1, Math.min(filters.limit, 100))}` : '';
    return {
        query: `
      SELECT
        ts.id,
        ts.title,
        ts.description,
        tt.code AS test_type,
        ts.status,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.starts_at,
        ts.ends_at,
        COUNT(DISTINCT s.participant_id) AS participant_count,
        COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'scored') THEN s.participant_id END) AS completed_count
      FROM test_sessions ts
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      LEFT JOIN submissions s ON s.test_session_id = ts.id
      ${whereClause}
      GROUP BY
        ts.id,
        ts.title,
        ts.description,
        tt.code,
        ts.status,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.starts_at,
        ts.ends_at,
        ts.updated_at
      ORDER BY ts.updated_at DESC, ts.id DESC
      ${limit}
    `,
        params,
    };
}
export async function fetchTestSessions(filters = {}) {
    const pool = getDbPool();
    const { query, params } = buildSummaryQuery(filters);
    const [rows] = await pool.query(query, params);
    return rows.map(mapSessionSummary);
}
export async function fetchTestSessionById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT
        ts.id,
        ts.title,
        ts.description,
        tt.code AS test_type,
        ts.status,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.starts_at,
        ts.ends_at,
        COUNT(DISTINCT s.participant_id) AS participant_count,
        COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'scored') THEN s.participant_id END) AS completed_count
      FROM test_sessions ts
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      LEFT JOIN submissions s ON s.test_session_id = ts.id
      WHERE ts.id = ?
      GROUP BY
        ts.id,
        ts.title,
        ts.description,
        tt.code,
        ts.status,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.starts_at,
        ts.ends_at
      LIMIT 1
    `, [id]);
    const row = rows[0];
    if (!row) {
        return null;
    }
    const [participantRows] = await pool.query(`
      SELECT
        s.id AS submission_id,
        p.id AS participant_id,
        p.full_name,
        p.email,
        p.employee_code,
        p.department,
        p.position_title,
        s.attempt_no,
        s.status,
        s.started_at,
        s.submitted_at,
        r.id AS result_id,
        r.score_total,
        r.score_band,
        r.profile_code,
        r.result_payload_json
      FROM submissions s
      INNER JOIN participants p ON p.id = s.participant_id
      LEFT JOIN results r ON r.submission_id = s.id
      WHERE s.test_session_id = ?
      ORDER BY COALESCE(s.submitted_at, s.started_at, s.created_at) DESC, s.id DESC
    `, [id]);
    const summary = mapSessionSummary(row);
    return {
        ...summary,
        instructions: parseInstructions(row.instructions),
        completionRate: summary.participantCount === 0 ? 0 : Math.round((summary.completedCount / summary.participantCount) * 100),
        participants: participantRows.map((participant) => ({
            submissionId: participant.submission_id,
            participantId: participant.participant_id,
            fullName: participant.full_name,
            email: participant.email,
            employeeCode: participant.employee_code,
            department: participant.department,
            positionTitle: participant.position_title,
            attemptNo: participant.attempt_no,
            status: participant.status,
            startedAt: toIsoString(participant.started_at),
            submittedAt: toIsoString(participant.submitted_at),
            resultId: participant.result_id,
            scoreTotal: participant.score_total,
            scoreBand: participant.score_band,
            profileCode: participant.profile_code,
            reviewStatus: participant.result_id ? parseReviewStatus(participant.result_payload_json) : null,
        })),
    };
}
export async function createTestSessionRecord(input) {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [testTypeRows] = await connection.query('SELECT id FROM test_types WHERE code = ? LIMIT 1', [input.testType]);
        const testTypeId = Number(testTypeRows[0]?.id ?? 0);
        if (!testTypeId) {
            throw new Error(`Unknown test type: ${input.testType}`);
        }
        const accessToken = createAccessToken(input.testType, input.title);
        const [insertResult] = await connection.query(`
        INSERT INTO test_sessions (
          test_type_id,
          title,
          description,
          access_token,
          instructions,
          settings_json,
          time_limit_minutes,
          status,
          starts_at,
          ends_at,
          created_by_admin_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            testTypeId,
            input.title.trim(),
            input.description?.trim() || null,
            accessToken,
            input.instructions?.trim() ? input.instructions.trim() : null,
            JSON.stringify(input.settings),
            input.timeLimitMinutes ?? null,
            input.status,
            input.startsAt ? new Date(input.startsAt) : null,
            input.endsAt ? new Date(input.endsAt) : null,
            input.createdByAdminId,
        ]);
        await connection.commit();
        return fetchTestSessionById(insertResult.insertId);
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateTestSessionRecord(id, input) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE test_sessions
      SET
        title = ?,
        description = ?,
        instructions = ?,
        settings_json = ?,
        time_limit_minutes = ?,
        status = ?,
        starts_at = ?,
        ends_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
        input.title.trim(),
        input.description?.trim() || null,
        input.instructions?.trim() ? input.instructions.trim() : null,
        JSON.stringify(input.settings),
        input.timeLimitMinutes ?? null,
        input.status,
        input.startsAt ? new Date(input.startsAt) : null,
        input.endsAt ? new Date(input.endsAt) : null,
        id,
    ]);
    return fetchTestSessionById(id);
}
