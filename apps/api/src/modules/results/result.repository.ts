import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';
import type { StoredResultRecord } from './result.service.js';

interface ResultListRow extends RowDataPacket {
  id: number;
  submission_id: number;
  participant_id: number;
  participant_name: string;
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
  return rows.map((row) => ({
    id: row.id,
    submissionId: row.submission_id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    testType: row.test_type,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : String(row.submitted_at ?? ''),
    scoreTotal: row.score_total,
    scoreBand: row.score_band,
    primaryType: row.primary_type,
    secondaryType: row.secondary_type,
    profileCode: row.profile_code,
    interpretationKey: row.interpretation_key,
    resultPayload: normalizePayload(row.result_payload_json),
    summaries: summaryRows
      .filter((summary) => summary.result_id === row.id)
      .map((summary) => ({
        metricKey: summary.metric_key,
        metricLabel: summary.metric_label,
        score: summary.score,
        band: summary.band,
      })),
  }));
}

export async function fetchResults() {
  const pool = getDbPool();
  const [rows] = await pool.query<ResultListRow[]>(
    `
      SELECT
        r.id,
        r.submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        tt.code AS test_type,
        s.submitted_at,
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
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `,
  );

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
        tt.code AS test_type,
        s.submitted_at,
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
  return attachSummaries([row], summaries)[0] ?? null;
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
        JSON.stringify(input.scoredResult.payload),
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
