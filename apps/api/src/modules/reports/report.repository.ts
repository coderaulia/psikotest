import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import { fetchDiscDistribution, fetchWorkloadDistribution } from '../dashboard/dashboard.repository.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';

interface SummaryCountRow extends RowDataPacket {
  value: number | null;
}

interface AverageByTypeRow extends RowDataPacket {
  test_type: PublicTestTypeCode;
  average_score: number | null;
  submission_count: number;
}

interface RecentCompletionRow extends RowDataPacket {
  result_id: number;
  participant_name: string;
  session_title: string;
  test_type: PublicTestTypeCode;
  submitted_at: Date | string | null;
  score_band: string | null;
  profile_code: string | null;
  review_status: string | null;
}

interface ReviewStatusRow extends RowDataPacket {
  review_status: string | null;
  value: number;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function fetchReportOverviewCounts() {
  const pool = getDbPool();
  const [[resultRows], [participantRows], [sessionRows]] = await Promise.all([
    pool.query<SummaryCountRow[]>('SELECT COUNT(*) AS value FROM results'),
    pool.query<SummaryCountRow[]>('SELECT COUNT(*) AS value FROM participants'),
    pool.query<SummaryCountRow[]>("SELECT COUNT(*) AS value FROM test_sessions WHERE status IN ('active', 'completed')"),
  ]);

  return {
    scoredResults: Number(resultRows[0]?.value ?? 0),
    participants: Number(participantRows[0]?.value ?? 0),
    reportableSessions: Number(sessionRows[0]?.value ?? 0),
  };
}

export async function fetchAverageScoresByTestType() {
  const pool = getDbPool();
  const [rows] = await pool.query<AverageByTypeRow[]>(
    `
      SELECT
        tt.code AS test_type,
        ROUND(AVG(r.score_total), 2) AS average_score,
        COUNT(*) AS submission_count
      FROM results r
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      GROUP BY tt.code
      ORDER BY FIELD(tt.code, 'iq', 'disc', 'workload', 'custom'), tt.code ASC
    `,
  );

  return rows.map((row) => ({
    testType: row.test_type,
    averageScore: row.average_score == null ? null : Number(row.average_score),
    submissionCount: Number(row.submission_count ?? 0),
  }));
}

export async function fetchReviewStatusDistribution() {
  const pool = getDbPool();
  const [rows] = await pool.query<ReviewStatusRow[]>(
    `
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) AS review_status,
        COUNT(*) AS value
      FROM results r
      GROUP BY review_status
    `,
  );

  return rows.map((row) => ({
    label: row.review_status === 'reviewed' ? 'Reviewed' : 'Preliminary',
    value: Number(row.value ?? 0),
  }));
}

export async function fetchRecentCompletions(limit = 8) {
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const [rows] = await pool.query<RecentCompletionRow[]>(
    `
      SELECT
        r.id AS result_id,
        p.full_name AS participant_name,
        ts.title AS session_title,
        tt.code AS test_type,
        COALESCE(s.submitted_at, r.created_at) AS submitted_at,
        r.score_band,
        r.profile_code,
        JSON_UNQUOTE(JSON_EXTRACT(COALESCE(r.result_payload_json, JSON_OBJECT()), '$.reviewStatus')) AS review_status
      FROM results r
      INNER JOIN submissions s ON s.id = r.submission_id
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
      LIMIT ${safeLimit}
    `,
  );

  return rows.map((row) => ({
    id: row.result_id,
    participantName: row.participant_name,
    sessionTitle: row.session_title,
    testType: row.test_type,
    submittedAt: toIsoString(row.submitted_at),
    summary: row.profile_code ?? row.score_band ?? 'Scored assessment',
    reviewStatus: row.review_status === 'reviewed' ? 'reviewed' : 'preliminary',
  }));
}

export async function fetchReportsSummaryData() {
  const [counts, averagesByTestType, discDistribution, workloadDistribution, reviewStatus, recentCompletions] = await Promise.all([
    fetchReportOverviewCounts(),
    fetchAverageScoresByTestType(),
    fetchDiscDistribution(),
    fetchWorkloadDistribution(),
    fetchReviewStatusDistribution(),
    fetchRecentCompletions(),
  ]);

  return {
    counts,
    averagesByTestType,
    distributions: {
      disc: discDistribution,
      workload: workloadDistribution,
      reviewStatus,
    },
    recentCompletions,
  };
}
