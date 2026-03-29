import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import { parseTestSessionSettings } from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';

export type CustomerWorkspaceReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';

export interface CustomerWorkspaceResultRecord {
  resultId: number;
  assessmentId: number;
  assessmentTitle: string;
  participantName: string;
  participantEmail: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoreTotal: number | null;
  scoreBand: string | null;
  profileCode: string | null;
  reviewStatus: CustomerWorkspaceReviewStatus;
  distributionPolicy: 'hr_only' | 'participant_summary' | 'full_report_with_consent';
  participantResultAccess: 'none' | 'summary' | 'full_released';
  hrResultAccess: 'none' | 'summary' | 'full';
  protectedDeliveryMode: boolean;
  releasedSummary: string | null;
  visibilityNote: string;
}

interface ResultRow extends RowDataPacket {
  result_id: number;
  assessment_id: number;
  assessment_title: string;
  participant_name: string;
  participant_email: string;
  test_type: PublicTestTypeCode;
  submitted_at: string | Date | null;
  score_total: number | null;
  score_band: string | null;
  profile_code: string | null;
  result_payload_json: string | Record<string, unknown> | null;
  settings_json: string | Record<string, unknown> | null;
}

function normalizePayload(payload: string | Record<string, unknown> | null) {
  if (!payload) {
    return {} as Record<string, unknown>;
  }

  if (typeof payload === 'string') {
    return JSON.parse(payload) as Record<string, unknown>;
  }

  return payload;
}

function readReviewStatus(payload: Record<string, unknown>): CustomerWorkspaceReviewStatus {
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

function toIsoString(value: string | Date | null) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function buildVisibilityNote(input: {
  reviewStatus: CustomerWorkspaceReviewStatus;
  distributionPolicy: 'hr_only' | 'participant_summary' | 'full_report_with_consent';
  participantResultAccess: 'none' | 'summary' | 'full_released';
}) {
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

function mapRow(row: ResultRow): CustomerWorkspaceResultRecord {
  const payload = normalizePayload(row.result_payload_json);
  const reviewStatus = readReviewStatus(payload);
  const sessionSettings = parseTestSessionSettings(row.settings_json);
  const releasedSummary = reviewStatus === 'released' && typeof payload.professionalSummary === 'string'
    ? String(payload.professionalSummary)
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
    visibilityNote: buildVisibilityNote({
      reviewStatus,
      distributionPolicy: sessionSettings.distributionPolicy,
      participantResultAccess: sessionSettings.participantResultAccess,
    }),
  };
}

export async function fetchCustomerWorkspaceResults(customerAccountId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<ResultRow[]>(
    `
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
      WHERE ca.customer_account_id = ?
      ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
      LIMIT 300
    `,
    [customerAccountId],
  );

  return rows.map(mapRow);
}
