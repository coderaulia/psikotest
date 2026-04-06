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
function readReviewStatus(payload) {
    if (typeof payload.releasedAt === 'string' && payload.releasedAt.length > 0) {
        return 'released';
    }
    if (payload.reviewStatus === 'released') {
        return 'released';
    }
    if (payload.reviewStatus === 'reviewed') {
        return 'reviewed';
    }
    if (payload.reviewStatus === 'in_review') {
        return 'in_review';
    }
    return 'scored_preliminary';
}
function toIsoString(value) {
    if (!value) {
        return new Date().toISOString();
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function buildVisibilityNote(input) {
    if (input.reviewStatus !== 'released') {
        return 'Reviewer draft content is hidden until the report is released.';
    }
    if (input.distributionPolicy === 'hr_only') {
        return 'This result remains restricted to internal HR visibility settings.';
    }
    if (input.participantResultAccess === 'none') {
        return 'Participants do not receive a result view for this assessment.';
    }
    if (input.participantResultAccess === 'full_released') {
        return 'The released report can now be shared according to the configured access policy.';
    }
    return 'Only the released customer-facing summary is visible here.';
}
function mapRow(row) {
    const payload = normalizePayload(row.result_payload_json);
    const reviewStatus = readReviewStatus(payload);
    const sessionSettings = parseTestSessionSettings(row.settings_json);
    const releasedSummary = reviewStatus === 'released' && typeof payload.professionalSummary === 'string'
        ? String(payload.professionalSummary)
        : null;
    const releasedRecommendation = reviewStatus === 'released' && typeof payload.recommendation === 'string'
        ? String(payload.recommendation)
        : null;
    const releasedLimitations = reviewStatus === 'released' && typeof payload.limitations === 'string'
        ? String(payload.limitations)
        : null;
    return {
        resultId: row.result_id,
        assessmentId: row.assessment_id,
        assessmentTitle: row.assessment_title,
        participantName: row.participant_name,
        participantEmail: row.participant_email,
        testType: row.test_type,
        submittedAt: toIsoString(row.submitted_at),
        scoreTotal: row.score_total,
        scoreBand: row.score_band,
        profileCode: row.profile_code,
        reviewStatus,
        distributionPolicy: sessionSettings.distributionPolicy,
        participantResultAccess: sessionSettings.participantResultAccess,
        hrResultAccess: sessionSettings.hrResultAccess,
        protectedDeliveryMode: sessionSettings.protectedDeliveryMode,
        releasedSummary,
        releasedRecommendation,
        releasedLimitations,
        visibilityNote: buildVisibilityNote({
            reviewStatus,
            distributionPolicy: sessionSettings.distributionPolicy,
            participantResultAccess: sessionSettings.participantResultAccess,
        }),
    };
}
function buildBaseResultsQuery(whereClause) {
    return `
      SELECT
        r.id AS result_id,
        ca.id AS assessment_id,
        ts.title AS assessment_title,
        p.full_name AS participant_name,
        p.email AS participant_email,
        tt.code AS test_type,
        COALESCE(s.submitted_at, r.created_at) AS submitted_at,
        r.score_total,
        r.score_band,
        r.profile_code,
        r.result_payload_json,
        ts.settings_json
      FROM customer_assessments ca
      INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
      INNER JOIN submissions s ON s.test_session_id = ts.id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN results r ON r.submission_id = s.id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      ${whereClause}
    `;
}
async function fetchResultMetrics(resultId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT
        metric_key,
        metric_label,
        score,
        band
      FROM result_summaries
      WHERE result_id = ?
      ORDER BY sort_order ASC, id ASC
    `, [resultId]);
    return rows.map((row) => ({
        metricKey: row.metric_key,
        metricLabel: row.metric_label,
        score: row.score,
        band: row.band,
    }));
}
export async function fetchCustomerWorkspaceResults(customerAccountId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${buildBaseResultsQuery('WHERE ca.customer_account_id = ?')}
      ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
      LIMIT 300
    `, [customerAccountId]);
    return rows.map(mapRow);
}
export async function fetchCustomerWorkspaceResultDetail(customerAccountId, resultId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`${buildBaseResultsQuery('WHERE ca.customer_account_id = ? AND r.id = ?')}
      LIMIT 1
    `, [customerAccountId, resultId]);
    const row = rows[0];
    if (!row) {
        return null;
    }
    return {
        ...mapRow(row),
        metrics: await fetchResultMetrics(row.result_id),
    };
}
