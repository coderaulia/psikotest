import { getDbPool } from '../../database/mysql.js';
import { parseTestSessionSettings } from '../test-sessions/session-settings.js';
function normalizePayload(payload) {
    if (!payload) {
        return {};
    }
    if (typeof payload === 'string') {
        return JSON.parse(payload);
    }
    return payload;
}
function mapSummaryType(summary) {
    if (['D', 'I', 'S', 'C'].includes(summary.metricKey)) {
        return 'dimension';
    }
    if (summary.metricKey.startsWith('overall') || summary.metricKey.includes('accuracy') || summary.metricKey.includes('correct')) {
        return 'summary';
    }
    return 'category';
}
function toIsoString(value) {
    if (!value) {
        return new Date().toISOString();
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function readOptionalString(payload, key) {
    return typeof payload[key] === 'string' ? String(payload[key]) : null;
}
function readOptionalNumber(payload, key) {
    return typeof payload[key] === 'number' ? Number(payload[key]) : null;
}
function normalizeReviewStatus(payload) {
    if (typeof payload.releasedAt === 'string' && payload.releasedAt.length > 0) {
        return 'released';
    }
    const rawStatus = typeof payload.reviewStatus === 'string' ? payload.reviewStatus : null;
    if (rawStatus === 'released') {
        return 'released';
    }
    if (rawStatus === 'reviewed') {
        return 'reviewed';
    }
    if (rawStatus === 'in_review') {
        return 'in_review';
    }
    return 'scored_preliminary';
}
function readReviewState(payload) {
    return {
        reviewStatus: normalizeReviewStatus(payload),
        reviewStartedAt: readOptionalString(payload, 'reviewStartedAt'),
        reviewedAt: readOptionalString(payload, 'reviewedAt'),
        reviewedByAdminId: readOptionalNumber(payload, 'reviewedByAdminId'),
        reviewerAdminId: readOptionalNumber(payload, 'reviewerAdminId'),
        releasedAt: readOptionalString(payload, 'releasedAt'),
        releasedByAdminId: readOptionalNumber(payload, 'releasedByAdminId'),
        professionalSummary: readOptionalString(payload, 'professionalSummary'),
        recommendation: readOptionalString(payload, 'recommendation'),
        limitations: readOptionalString(payload, 'limitations'),
        reviewerNotes: readOptionalString(payload, 'reviewerNotes'),
    };
}
async function loadSummariesForResultIds(resultIds) {
    if (resultIds.length === 0) {
        return [];
    }
    const pool = getDbPool();
    const placeholders = resultIds.map(() => '?').join(', ');
    const [rows] = await pool.query(`
      SELECT result_id, metric_key, metric_label, score, band
      FROM result_summaries
      WHERE result_id IN (${placeholders})
      ORDER BY sort_order ASC, id ASC
    `, resultIds);
    return rows;
}
function attachSummaries(rows, summaryRows) {
    return rows.map((row) => {
        const resultPayload = normalizePayload(row.result_payload_json);
        const reviewState = readReviewState(resultPayload);
        const sessionSettings = parseTestSessionSettings(row.settings_json);
        return {
            id: row.id,
            submissionId: row.submission_id,
            participantId: row.participant_id,
            participantName: row.participant_name,
            participantEmail: row.participant_email,
            department: row.department,
            positionTitle: row.position_title,
            sessionId: row.session_id,
            sessionTitle: row.session_title,
            accessToken: row.access_token,
            testType: row.test_type,
            submittedAt: toIsoString(row.submitted_at),
            scoreTotal: row.score_total,
            scoreBand: row.score_band,
            primaryType: row.primary_type,
            secondaryType: row.secondary_type,
            profileCode: row.profile_code,
            interpretationKey: row.interpretation_key,
            reviewStatus: reviewState.reviewStatus,
            reviewStartedAt: reviewState.reviewStartedAt,
            reviewedAt: reviewState.reviewedAt,
            reviewedByAdminId: reviewState.reviewedByAdminId,
            reviewerAdminId: reviewState.reviewerAdminId,
            releasedAt: reviewState.releasedAt,
            releasedByAdminId: reviewState.releasedByAdminId,
            professionalSummary: reviewState.professionalSummary,
            recommendation: reviewState.recommendation,
            limitations: reviewState.limitations,
            reviewerNotes: reviewState.reviewerNotes,
            distributionPolicy: sessionSettings.distributionPolicy,
            participantResultAccess: sessionSettings.participantResultAccess,
            hrResultAccess: sessionSettings.hrResultAccess,
            protectedDeliveryMode: sessionSettings.protectedDeliveryMode,
            resultPayload,
            summaries: summaryRows
                .filter((summary) => summary.result_id === row.id)
                .map((summary) => ({
                metricKey: summary.metric_key,
                metricLabel: summary.metric_label,
                score: summary.score,
                band: summary.band,
            })),
        };
    });
}
function buildReviewStatusCondition(reviewStatus) {
    if (reviewStatus === 'released') {
        return `(
      JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) = 'released'
      OR JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.releasedAt')) IS NOT NULL
    )`;
    }
    if (reviewStatus === 'reviewed') {
        return `(
      JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) = 'reviewed'
      AND JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.releasedAt')) IS NULL
    )`;
    }
    if (reviewStatus === 'in_review') {
        return `JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) = 'in_review'`;
    }
    return `(
    JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) IS NULL
    OR JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) IN ('preliminary', 'scored_preliminary')
  )`;
}
function buildResultQuery(filters = {}) {
    const conditions = [];
    const params = [];
    const search = filters.search?.trim();
    if (search) {
        const like = `%${search}%`;
        conditions.push('(p.full_name LIKE ? OR p.email LIKE ? OR ts.title LIKE ?)');
        params.push(like, like, like);
    }
    if (filters.testType) {
        conditions.push('tt.code = ?');
        params.push(filters.testType);
    }
    if (filters.dateFrom) {
        conditions.push('DATE(COALESCE(s.submitted_at, r.created_at)) >= ?');
        params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        conditions.push('DATE(COALESCE(s.submitted_at, r.created_at)) <= ?');
        params.push(filters.dateTo);
    }
    if (filters.reviewStatus) {
        conditions.push(buildReviewStatusCondition(filters.reviewStatus));
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.max(1, Math.min(filters.limit ?? 100, 200));
    return {
        query: `
      SELECT
        r.id,
        r.submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email,
        p.employee_code,
        p.department,
        p.position_title,
        ts.id AS session_id,
        ts.title AS session_title,
        ts.access_token,
        tt.code AS test_type,
        COALESCE(s.submitted_at, r.created_at) AS submitted_at,
        r.score_total,
        r.score_band,
        r.primary_type,
        r.secondary_type,
        r.profile_code,
        r.interpretation_key,
        r.result_payload_json,
        ts.settings_json
      FROM results r
      INNER JOIN submissions s ON s.id = r.submission_id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      ${whereClause}
      ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
      LIMIT ${limit}
    `,
        params,
    };
}
export async function fetchResults(filters = {}) {
    const pool = getDbPool();
    const { query, params } = buildResultQuery(filters);
    const [rows] = await pool.query(query, params);
    const summaries = await loadSummariesForResultIds(rows.map((row) => row.id));
    return attachSummaries(rows, summaries);
}
export async function fetchReviewerQueueRecords(limit = 50) {
    const items = await fetchResults({ limit: Math.max(1, Math.min(limit, 100)) });
    return items.filter((item) => item.reviewStatus !== 'released');
}
async function buildResultDetail(row) {
    const summaries = await loadSummariesForResultIds([row.id]);
    const base = attachSummaries([row], summaries)[0];
    return {
        ...base,
        participant: {
            id: row.participant_id,
            fullName: row.participant_name,
            email: row.participant_email,
            employeeCode: row.employee_code,
            department: row.department,
            positionTitle: row.position_title,
        },
        session: {
            id: row.session_id,
            title: row.session_title,
            accessToken: row.access_token,
            testType: row.test_type,
        },
    };
}
export async function fetchResultById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT
        r.id,
        r.submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email,
        p.employee_code,
        p.department,
        p.position_title,
        ts.id AS session_id,
        ts.title AS session_title,
        ts.access_token,
        tt.code AS test_type,
        COALESCE(s.submitted_at, r.created_at) AS submitted_at,
        r.score_total,
        r.score_band,
        r.primary_type,
        r.secondary_type,
        r.profile_code,
        r.interpretation_key,
        r.result_payload_json,
        ts.settings_json
      FROM results r
      INNER JOIN submissions s ON s.id = r.submission_id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      WHERE r.id = ?
      LIMIT 1
    `, [id]);
    const row = rows[0];
    if (!row) {
        return null;
    }
    return buildResultDetail(row);
}
export async function fetchResultBySubmissionId(submissionId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT
        r.id,
        r.submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email,
        p.employee_code,
        p.department,
        p.position_title,
        ts.id AS session_id,
        ts.title AS session_title,
        ts.access_token,
        tt.code AS test_type,
        COALESCE(s.submitted_at, r.created_at) AS submitted_at,
        r.score_total,
        r.score_band,
        r.primary_type,
        r.secondary_type,
        r.profile_code,
        r.interpretation_key,
        r.result_payload_json,
        ts.settings_json
      FROM results r
      INNER JOIN submissions s ON s.id = r.submission_id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      WHERE r.submission_id = ?
      LIMIT 1
    `, [submissionId]);
    const row = rows[0];
    if (!row) {
        return null;
    }
    return buildResultDetail(row);
}
function applyReviewValue(currentPayload, key, value) {
    if (value === undefined) {
        return currentPayload[key] ?? null;
    }
    return value && value.trim().length > 0 ? value.trim() : null;
}
export async function saveResultReviewRecord(id, input, adminId) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT result_payload_json FROM results WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) {
        return null;
    }
    const currentPayload = normalizePayload(rows[0].result_payload_json ?? null);
    const currentState = readReviewState(currentPayload);
    const hasReviewContentUpdate = [
        input.professionalSummary,
        input.recommendation,
        input.limitations,
        input.reviewerNotes,
    ].some((value) => value !== undefined);
    const now = new Date().toISOString();
    let nextStatus = input.reviewStatus ?? currentState.reviewStatus;
    if (!input.reviewStatus && hasReviewContentUpdate && currentState.reviewStatus === 'scored_preliminary') {
        nextStatus = 'in_review';
    }
    const nextReviewerAdminId = input.reviewerAdminId === undefined
        ? currentState.reviewerAdminId
        : input.reviewerAdminId;
    const nextPayload = {
        ...currentPayload,
        professionalSummary: applyReviewValue(currentPayload, 'professionalSummary', input.professionalSummary),
        recommendation: applyReviewValue(currentPayload, 'recommendation', input.recommendation),
        limitations: applyReviewValue(currentPayload, 'limitations', input.limitations),
        reviewerNotes: applyReviewValue(currentPayload, 'reviewerNotes', input.reviewerNotes),
        reviewerAdminId: nextReviewerAdminId,
        reviewStatus: nextStatus,
    };
    if (nextStatus === 'scored_preliminary') {
        nextPayload.reviewStartedAt = null;
        nextPayload.reviewedAt = null;
        nextPayload.reviewedByAdminId = null;
        nextPayload.reviewerAdminId = nextReviewerAdminId;
        nextPayload.releasedAt = null;
        nextPayload.releasedByAdminId = null;
    }
    if (nextStatus === 'in_review') {
        nextPayload.reviewStartedAt = currentState.reviewStartedAt ?? now;
        nextPayload.reviewerAdminId = nextReviewerAdminId ?? adminId;
        nextPayload.reviewedAt = null;
        nextPayload.reviewedByAdminId = null;
        nextPayload.releasedAt = null;
        nextPayload.releasedByAdminId = null;
    }
    if (nextStatus === 'reviewed') {
        nextPayload.reviewStartedAt = currentState.reviewStartedAt ?? now;
        nextPayload.reviewerAdminId = nextReviewerAdminId ?? adminId;
        nextPayload.reviewedAt = now;
        nextPayload.reviewedByAdminId = adminId;
        nextPayload.releasedAt = null;
        nextPayload.releasedByAdminId = null;
    }
    if (nextStatus === 'released') {
        nextPayload.reviewStartedAt = currentState.reviewStartedAt ?? now;
        nextPayload.reviewerAdminId = nextReviewerAdminId ?? adminId;
        nextPayload.reviewedAt = currentState.reviewedAt ?? now;
        nextPayload.reviewedByAdminId = currentState.reviewedByAdminId ?? adminId;
        nextPayload.releasedAt = now;
        nextPayload.releasedByAdminId = adminId;
    }
    await pool.query(`
      UPDATE results
      SET result_payload_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(nextPayload), id]);
    return fetchResultById(id);
}
export async function upsertResultRecord(input) {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [testTypeRows] = await connection.query('SELECT id FROM test_types WHERE code = ? LIMIT 1', [input.testType]);
        const testTypeId = Number(testTypeRows[0]?.id ?? 0);
        if (!testTypeId) {
            throw new Error(`Unknown test type: ${input.testType}`);
        }
        const [existingResultRows] = await connection.query('SELECT id, result_payload_json FROM results WHERE submission_id = ? LIMIT 1', [input.submissionId]);
        const existingPayload = normalizePayload(existingResultRows[0]?.result_payload_json ?? null);
        const existingReviewState = readReviewState(existingPayload);
        const resultPayload = {
            ...existingPayload,
            ...input.scoredResult.payload,
            reviewStatus: existingReviewState.reviewStatus,
            reviewStartedAt: existingReviewState.reviewStartedAt,
            reviewedAt: existingReviewState.reviewedAt,
            reviewedByAdminId: existingReviewState.reviewedByAdminId,
            reviewerAdminId: existingReviewState.reviewerAdminId,
            releasedAt: existingReviewState.releasedAt,
            releasedByAdminId: existingReviewState.releasedByAdminId,
            professionalSummary: existingReviewState.professionalSummary,
            recommendation: existingReviewState.recommendation,
            limitations: existingReviewState.limitations,
            reviewerNotes: existingReviewState.reviewerNotes,
        };
        await connection.query(`
        INSERT INTO results (
          submission_id,
          test_type_id,
          score_total,
          score_band,
          primary_type,
          secondary_type,
          profile_code,
          interpretation_key,
          result_payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          score_total = VALUES(score_total),
          score_band = VALUES(score_band),
          primary_type = VALUES(primary_type),
          secondary_type = VALUES(secondary_type),
          profile_code = VALUES(profile_code),
          interpretation_key = VALUES(interpretation_key),
          result_payload_json = VALUES(result_payload_json),
          updated_at = CURRENT_TIMESTAMP
      `, [
            input.submissionId,
            testTypeId,
            input.scoredResult.scoreTotal,
            input.scoredResult.scoreBand,
            input.scoredResult.primaryType,
            input.scoredResult.secondaryType,
            input.scoredResult.profileCode,
            input.scoredResult.interpretationKey,
            JSON.stringify(resultPayload),
        ]);
        const [resultRows] = await connection.query('SELECT id FROM results WHERE submission_id = ? LIMIT 1', [input.submissionId]);
        const resultId = Number(resultRows[0]?.id ?? 0);
        await connection.query('DELETE FROM result_summaries WHERE result_id = ?', [resultId]);
        for (let index = 0; index < input.scoredResult.summaries.length; index += 1) {
            const summary = input.scoredResult.summaries[index];
            await connection.query(`
          INSERT INTO result_summaries (
            result_id,
            metric_key,
            metric_label,
            metric_type,
            score,
            band,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
                resultId,
                summary.metricKey,
                summary.metricLabel,
                mapSummaryType(summary),
                summary.score,
                summary.band ?? null,
                index + 1,
            ]);
        }
        await connection.query(`
        UPDATE submissions
        SET status = 'scored', submitted_at = ?, raw_score = ?
        WHERE id = ?
      `, [input.submittedAt, input.scoredResult.scoreTotal, input.submissionId]);
        await connection.commit();
        return fetchResultById(resultId);
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
