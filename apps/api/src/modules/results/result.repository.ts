import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';
import type {
  ResultListFilters,
  ResultReviewStatus,
  StoredResultDetailRecord,
  StoredResultRecord,
} from './result.service.js';

interface ResultListRow extends RowDataPacket {
  id: number;
  submission_id: number;
  participant_id: number;
  participant_name: string;
  participant_email: string;
  employee_code: string | null;
  department: string | null;
  position_title: string | null;
  session_id: number;
  session_title: string;
  access_token: string;
  test_type: PublicTestTypeCode;
  submitted_at: Date | string | null;
  score_total: number | null;
  score_band: string | null;
  primary_type: string | null;
  secondary_type: string | null;
  profile_code: string | null;
  interpretation_key: string | null;
  result_payload_json: string | Record<string, unknown> | null;
}

interface ResultSummaryRow extends RowDataPacket {
  result_id: number;
  metric_key: string;
  metric_label: string;
  score: number;
  band: string | null;
}

function normalizePayload(payload: string | Record<string, unknown> | null) {
  if (!payload) {
    return {};
  }

  if (typeof payload === 'string') {
    return JSON.parse(payload) as Record<string, unknown>;
  }

  return payload;
}

function mapSummaryType(summary: ResultSummaryItem) {
  if (['D', 'I', 'S', 'C'].includes(summary.metricKey)) {
    return 'dimension';
  }

  if (summary.metricKey.startsWith('overall') || summary.metricKey.includes('accuracy') || summary.metricKey.includes('correct')) {
    return 'summary';
  }

  return 'category';
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function readReviewState(payload: Record<string, unknown>) {
  return {
    reviewStatus: payload.reviewStatus === 'reviewed' ? 'reviewed' : 'preliminary',
    reviewedAt: typeof payload.reviewedAt === 'string' ? payload.reviewedAt : null,
    reviewedByAdminId:
      typeof payload.reviewedByAdminId === 'number' ? payload.reviewedByAdminId : null,
  } satisfies {
    reviewStatus: ResultReviewStatus;
    reviewedAt: string | null;
    reviewedByAdminId: number | null;
  };
}

async function loadSummariesForResultIds(resultIds: number[]) {
  if (resultIds.length === 0) {
    return [] as ResultSummaryRow[];
  }

  const pool = getDbPool();
  const placeholders = resultIds.map(() => '?').join(', ');
  const [rows] = await pool.query<ResultSummaryRow[]>(
    `
      SELECT result_id, metric_key, metric_label, score, band
      FROM result_summaries
      WHERE result_id IN (${placeholders})
      ORDER BY sort_order ASC, id ASC
    `,
    resultIds,
  );

  return rows;
}

function attachSummaries(rows: ResultListRow[], summaryRows: ResultSummaryRow[]): StoredResultRecord[] {
  return rows.map((row) => {
    const resultPayload = normalizePayload(row.result_payload_json);
    const reviewState = readReviewState(resultPayload);

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
      reviewedAt: reviewState.reviewedAt,
      reviewedByAdminId: reviewState.reviewedByAdminId,
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

function buildResultQuery(filters: ResultListFilters = {}) {
  const conditions: string[] = [];
  const params: Array<string> = [];

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
        r.result_payload_json
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

export async function fetchResults(filters: ResultListFilters = {}) {
  const pool = getDbPool();
  const { query, params } = buildResultQuery(filters);
  const [rows] = await pool.query<ResultListRow[]>(query, params);
  const summaries = await loadSummariesForResultIds(rows.map((row) => row.id));
  return attachSummaries(rows, summaries);
}

export async function fetchResultById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<ResultListRow[]>(
    `
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
        r.result_payload_json
      FROM results r
      INNER JOIN submissions s ON s.id = r.submission_id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      WHERE r.id = ?
      LIMIT 1
    `,
    [id],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

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
  } satisfies StoredResultDetailRecord;
}

export async function updateResultReviewStatusRecord(
  id: number,
  reviewStatus: ResultReviewStatus,
  adminId: number,
) {
  const pool = getDbPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT result_payload_json FROM results WHERE id = ? LIMIT 1',
    [id],
  );

  if (!rows[0]) {
    return null;
  }

  const currentPayload = normalizePayload(
    (rows[0].result_payload_json as string | Record<string, unknown> | null) ?? null,
  );

  const nextPayload: Record<string, unknown> = {
    ...currentPayload,
    reviewStatus,
    reviewedAt: reviewStatus === 'reviewed' ? new Date().toISOString() : null,
    reviewedByAdminId: reviewStatus === 'reviewed' ? adminId : null,
  };

  await pool.query(
    `
      UPDATE results
      SET result_payload_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [JSON.stringify(nextPayload), id],
  );

  return fetchResultById(id);
}

export async function upsertResultRecord(input: {
  submissionId: number;
  participantId: number;
  participantName: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoredResult: ScoredAssessmentResult;
}) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [testTypeRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM test_types WHERE code = ? LIMIT 1',
      [input.testType],
    );

    const testTypeId = Number(testTypeRows[0]?.id ?? 0);
    if (!testTypeId) {
      throw new Error(`Unknown test type: ${input.testType}`);
    }

    const resultPayload = {
      ...input.scoredResult.payload,
      reviewStatus: 'preliminary',
      reviewedAt: null,
      reviewedByAdminId: null,
    };

    await connection.query(
      `
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
      `,
      [
        input.submissionId,
        testTypeId,
        input.scoredResult.scoreTotal,
        input.scoredResult.scoreBand,
        input.scoredResult.primaryType,
        input.scoredResult.secondaryType,
        input.scoredResult.profileCode,
        input.scoredResult.interpretationKey,
        JSON.stringify(resultPayload),
      ],
    );

    const [resultRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM results WHERE submission_id = ? LIMIT 1',
      [input.submissionId],
    );
    const resultId = Number(resultRows[0]?.id ?? 0);

    await connection.query('DELETE FROM result_summaries WHERE result_id = ?', [resultId]);

    for (let index = 0; index < input.scoredResult.summaries.length; index += 1) {
      const summary = input.scoredResult.summaries[index];
      await connection.query(
        `
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
        `,
        [
          resultId,
          summary.metricKey,
          summary.metricLabel,
          mapSummaryType(summary),
          summary.score,
          summary.band ?? null,
          index + 1,
        ],
      );
    }

    await connection.query(
      `
        UPDATE submissions
        SET status = 'scored', submitted_at = ?, raw_score = ?
        WHERE id = ?
      `,
      [input.submittedAt, input.scoredResult.scoreTotal, input.submissionId],
    );

    await connection.commit();
    return fetchResultById(resultId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
