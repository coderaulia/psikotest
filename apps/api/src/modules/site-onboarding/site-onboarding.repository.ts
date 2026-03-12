import { randomBytes } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { env } from '../../config/env.js';
import { getDbPool } from '../../database/mysql.js';
import { parseTestSessionSettings, type AssessmentPurpose, type AdministrationMode, type InterpretationMode, type TestSessionSettings } from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';

export type CustomerAccountType = 'business' | 'researcher';
export type CustomerAssessmentPlanStatus = 'trial' | 'upgraded';
export type CustomerAssessmentResultVisibility = 'participant_summary' | 'review_required';

export interface CustomerAssessmentListItem {
  assessmentId: number;
  sessionId: number;
  title: string;
  organizationName: string;
  testType: PublicTestTypeCode;
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  resultVisibility: CustomerAssessmentResultVisibility;
  timeLimitMinutes: number | null;
  participantLimit: number | null;
  sessionStatus: 'draft' | 'active' | 'completed' | 'archived';
  planStatus: CustomerAssessmentPlanStatus;
  participantLink: string;
  previewDemoLink: string;
  createdAt: string;
}

interface PlatformAdminRow extends RowDataPacket {
  id: number;
}

interface TestTypeRow extends RowDataPacket {
  id: number;
}

interface CustomerAssessmentRow extends RowDataPacket {
  assessment_id: number;
  session_id: number;
  title: string;
  organization_name_snapshot: string;
  test_type: PublicTestTypeCode;
  time_limit_minutes: number | null;
  settings_json: string | Record<string, unknown> | null;
  session_status: 'draft' | 'active' | 'completed' | 'archived';
  plan_status: CustomerAssessmentPlanStatus;
  access_token: string;
  created_at: string | Date;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);

  return slug || 'session';
}

function createAccessToken(testType: PublicTestTypeCode, title: string) {
  const suffix = randomBytes(3).toString('hex');
  return `${testType}-${slugify(title)}-${suffix}`.slice(0, 80);
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function getPreviewDemoToken(testType: PublicTestTypeCode) {
  if (testType === 'disc') {
    return 'disc-batch-a';
  }

  if (testType === 'iq') {
    return 'iq-screening';
  }

  if (testType === 'workload') {
    return 'workload-check';
  }

  return 'research-scale-pilot';
}

function mapResultVisibility(settings: TestSessionSettings): CustomerAssessmentResultVisibility {
  return settings.interpretationMode === 'professional_review' ? 'review_required' : 'participant_summary';
}

function mapAssessmentRow(row: CustomerAssessmentRow): CustomerAssessmentListItem {
  const settings = parseTestSessionSettings(row.settings_json);

  return {
    assessmentId: row.assessment_id,
    sessionId: row.session_id,
    title: row.title,
    organizationName: row.organization_name_snapshot,
    testType: row.test_type,
    assessmentPurpose: settings.assessmentPurpose,
    administrationMode: settings.administrationMode,
    resultVisibility: mapResultVisibility(settings),
    timeLimitMinutes: row.time_limit_minutes,
    participantLimit: settings.participantLimit,
    sessionStatus: row.session_status,
    planStatus: row.plan_status,
    participantLink: `${env.APP_ORIGIN}/t/${row.access_token}`,
    previewDemoLink: `${env.APP_ORIGIN}/t/${getPreviewDemoToken(row.test_type)}`,
    createdAt: toIsoString(row.created_at),
  };
}

export async function resolvePlatformAdminId() {
  const pool = getDbPool();
  const [rows] = await pool.query<PlatformAdminRow[]>(
    `
      SELECT id
      FROM admins
      WHERE status = 'active'
      ORDER BY CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, id ASC
      LIMIT 1
    `,
  );

  return Number(rows[0]?.id ?? 0);
}

export async function resolveTestTypeId(testType: PublicTestTypeCode) {
  const pool = getDbPool();
  const [rows] = await pool.query<TestTypeRow[]>(
    'SELECT id FROM test_types WHERE code = ? LIMIT 1',
    [testType],
  );

  return Number(rows[0]?.id ?? 0);
}

export async function insertCustomerAssessment(input: {
  customerAccountId: number;
  organizationName: string;
  testType: PublicTestTypeCode;
  title: string;
  description: string | null;
  instructions: string;
  timeLimitMinutes: number | null;
  settings: TestSessionSettings;
}) {
  const platformAdminId = await resolvePlatformAdminId();
  if (!platformAdminId) {
    throw new Error('No active platform admin is available');
  }

  const testTypeId = await resolveTestTypeId(input.testType);
  if (!testTypeId) {
    throw new Error(`Unknown test type: ${input.testType}`);
  }

  const accessToken = createAccessToken(input.testType, input.title);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [sessionResult] = await connection.query<ResultSetHeader>(
      `
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
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, ?)
      `,
      [
        testTypeId,
        input.title.trim(),
        input.description,
        accessToken,
        input.instructions.trim(),
        JSON.stringify(input.settings),
        input.timeLimitMinutes,
        platformAdminId,
      ],
    );

    const sessionId = Number(sessionResult.insertId);

    const [assessmentResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO customer_assessments (
          customer_account_id,
          test_session_id,
          organization_name_snapshot,
          onboarding_status,
          plan_status
        )
        VALUES (?, ?, ?, 'ready', 'trial')
      `,
      [input.customerAccountId, sessionId, input.organizationName.trim()],
    );

    await connection.commit();

    return {
      assessmentId: Number(assessmentResult.insertId),
      sessionId,
      accessToken,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function fetchCustomerAssessmentBySessionId(customerAccountId: number, sessionId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAssessmentRow[]>(
    `
      SELECT
        ca.id AS assessment_id,
        ts.id AS session_id,
        ts.title,
        ca.organization_name_snapshot,
        tt.code AS test_type,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.status AS session_status,
        ca.plan_status,
        ts.access_token,
        ca.created_at
      FROM customer_assessments ca
      INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE ca.customer_account_id = ?
        AND ca.test_session_id = ?
      LIMIT 1
    `,
    [customerAccountId, sessionId],
  );

  const row = rows[0];
  return row ? mapAssessmentRow(row) : null;
}

export async function fetchCustomerAssessments(customerAccountId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAssessmentRow[]>(
    `
      SELECT
        ca.id AS assessment_id,
        ts.id AS session_id,
        ts.title,
        ca.organization_name_snapshot,
        tt.code AS test_type,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.status AS session_status,
        ca.plan_status,
        ts.access_token,
        ca.created_at
      FROM customer_assessments ca
      INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE ca.customer_account_id = ?
      ORDER BY ca.created_at DESC, ca.id DESC
    `,
    [customerAccountId],
  );

  return rows.map(mapAssessmentRow);
}
