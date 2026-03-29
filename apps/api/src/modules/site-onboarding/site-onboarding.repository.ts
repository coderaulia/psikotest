import { randomBytes } from 'node:crypto';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { env } from '../../config/env.js';
import { getDbPool } from '../../database/mysql.js';
import {
  parseTestSessionSettings,
  type AssessmentPurpose,
  type AdministrationMode,
  type InterpretationMode,
  type TestSessionSettings,
} from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';

export type CustomerAccountType = 'business' | 'researcher';
export type CustomerAssessmentPlanStatus = 'trial' | 'upgraded';
export type CustomerAssessmentResultVisibility = 'participant_summary' | 'review_required';
export type CustomerAssessmentParticipantStatus = 'draft' | 'invited' | 'in_progress' | 'completed';
export type CustomerAssessmentInviteChannel = 'email' | 'link';

export interface CustomerAssessmentListItem {
  assessmentId: number;
  sessionId: number;
  title: string;
  organizationName: string;
  testType: PublicTestTypeCode;
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  resultVisibility: CustomerAssessmentResultVisibility;
  distributionPolicy: 'hr_only' | 'participant_summary' | 'full_report_with_consent';
  protectedDeliveryMode: boolean;
  participantResultAccess: 'none' | 'summary' | 'full_released';
  hrResultAccess: 'none' | 'summary' | 'full';
  timeLimitMinutes: number | null;
  participantLimit: number | null;
  sessionStatus: 'draft' | 'active' | 'completed' | 'archived';
  planStatus: CustomerAssessmentPlanStatus;
  participantLink: string;
  previewDemoLink: string;
  createdAt: string;
}

export interface CustomerAssessmentDetail extends CustomerAssessmentListItem {
  description: string | null;
  instructions: string[];
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
  interpretationMode: InterpretationMode;
  canActivateSharing: boolean;
}

export interface CustomerAssessmentParticipantItem {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
  status: CustomerAssessmentParticipantStatus;
  invitedVia: CustomerAssessmentInviteChannel | null;
  invitedAt: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  lastSubmittedAt: string | null;
  submissionStatus: 'not_started' | 'in_progress' | 'submitted' | 'scored' | null;
  resultId: number | null;
}

export interface CustomerAssessmentParticipantSummary {
  total: number;
  draft: number;
  invited: number;
  inProgress: number;
  completed: number;
}

export interface CustomerAssessmentParticipantListResponse {
  assessmentId: number;
  shareLink: string;
  summary: CustomerAssessmentParticipantSummary;
  items: CustomerAssessmentParticipantItem[];
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
  description: string | null;
  organization_name_snapshot: string;
  test_type: PublicTestTypeCode;
  time_limit_minutes: number | null;
  settings_json: string | Record<string, unknown> | null;
  instructions: string | null;
  session_status: 'draft' | 'active' | 'completed' | 'archived';
  plan_status: CustomerAssessmentPlanStatus;
  access_token: string;
  created_at: string | Date;
}

interface CustomerAssessmentParticipantRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  position_title: string | null;
  note: string | null;
  invitation_status: 'draft' | 'invited';
  invited_via: CustomerAssessmentInviteChannel | null;
  invited_at: string | Date | null;
  reminder_count: number;
  last_reminder_at: string | Date | null;
}

interface SubmissionMatchRow extends RowDataPacket {
  email: string;
  submission_status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  submitted_at: string | Date | null;
  result_id: number | null;
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
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseInstructions(value: string | null) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
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
    distributionPolicy: settings.distributionPolicy,
    protectedDeliveryMode: settings.protectedDeliveryMode,
    participantResultAccess: settings.participantResultAccess,
    hrResultAccess: settings.hrResultAccess,
    timeLimitMinutes: row.time_limit_minutes,
    participantLimit: settings.participantLimit,
    sessionStatus: row.session_status,
    planStatus: row.plan_status,
    participantLink: `${env.APP_ORIGIN}/t/${row.access_token}`,
    previewDemoLink: `${env.APP_ORIGIN}/t/${getPreviewDemoToken(row.test_type)}`,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
  };
}

function mapAssessmentDetailRow(row: CustomerAssessmentRow): CustomerAssessmentDetail {
  const settings = parseTestSessionSettings(row.settings_json);
  const base = mapAssessmentRow(row);

  return {
    ...base,
    description: row.description,
    instructions: parseInstructions(row.instructions),
    consentStatement: settings.consentStatement,
    privacyStatement: settings.privacyStatement,
    contactPerson: settings.contactPerson,
    interpretationMode: settings.interpretationMode,
    canActivateSharing: base.sessionStatus === 'draft',
  };
}

function getAssessmentSelectSql(whereClause: string) {
  return `
      SELECT
        ca.id AS assessment_id,
        ts.id AS session_id,
        ts.title,
        ts.description,
        ca.organization_name_snapshot,
        tt.code AS test_type,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.instructions,
        ts.status AS session_status,
        ca.plan_status,
        ts.access_token,
        ca.created_at
      FROM customer_assessments ca
      INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      ${whereClause}
    `;
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
    `${getAssessmentSelectSql('WHERE ca.customer_account_id = ? AND ca.test_session_id = ? LIMIT 1')}`,
    [customerAccountId, sessionId],
  );

  const row = rows[0];
  return row ? mapAssessmentRow(row) : null;
}

export async function fetchCustomerAssessmentById(customerAccountId: number, assessmentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAssessmentRow[]>(
    `${getAssessmentSelectSql('WHERE ca.customer_account_id = ? AND ca.id = ? LIMIT 1')}`,
    [customerAccountId, assessmentId],
  );

  const row = rows[0];
  return row ? mapAssessmentDetailRow(row) : null;
}

export async function fetchCustomerAssessments(customerAccountId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAssessmentRow[]>(
    `${getAssessmentSelectSql('WHERE ca.customer_account_id = ? ORDER BY ca.created_at DESC, ca.id DESC')}`,
    [customerAccountId],
  );

  return rows.map(mapAssessmentRow);
}

export async function updateCustomerAssessmentRecord(input: {
  customerAccountId: number;
  assessmentId: number;
  organizationName: string;
  testType: PublicTestTypeCode;
  title: string;
  description: string | null;
  instructions: string;
  timeLimitMinutes: number | null;
  settings: TestSessionSettings;
}) {
  const testTypeId = await resolveTestTypeId(input.testType);
  if (!testTypeId) {
    throw new Error(`Unknown test type: ${input.testType}`);
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT ca.id AS assessment_id, ts.id AS session_id, ts.status AS session_status
        FROM customer_assessments ca
        INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
        WHERE ca.customer_account_id = ?
          AND ca.id = ?
        LIMIT 1
      `,
      [input.customerAccountId, input.assessmentId],
    );

    const existing = existingRows[0];
    const sessionId = Number(existing?.session_id ?? 0);
    const sessionStatus = String(existing?.session_status ?? '');

    if (!sessionId) {
      await connection.rollback();
      return null;
    }

    if (sessionStatus !== 'draft') {
      throw new Error('Only draft assessments can be edited');
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE test_sessions
        SET test_type_id = ?,
            title = ?,
            description = ?,
            instructions = ?,
            settings_json = ?,
            time_limit_minutes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        testTypeId,
        input.title.trim(),
        input.description,
        input.instructions.trim(),
        JSON.stringify(input.settings),
        input.timeLimitMinutes,
        sessionId,
      ],
    );

    await connection.query<ResultSetHeader>(
      `
        UPDATE customer_assessments
        SET organization_name_snapshot = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [input.organizationName.trim(), input.assessmentId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return fetchCustomerAssessmentById(input.customerAccountId, input.assessmentId);
}

export async function activateCustomerAssessmentRecord(customerAccountId: number, assessmentId: number) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT ts.id AS session_id
        FROM customer_assessments ca
        INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
        WHERE ca.customer_account_id = ?
          AND ca.id = ?
        LIMIT 1
      `,
      [customerAccountId, assessmentId],
    );

    const sessionId = Number(existingRows[0]?.session_id ?? 0);
    if (!sessionId) {
      await connection.rollback();
      return null;
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE customer_assessments
        SET plan_status = 'upgraded', updated_at = CURRENT_TIMESTAMP
        WHERE customer_account_id = ?
          AND id = ?
      `,
      [customerAccountId, assessmentId],
    );

    await connection.query<ResultSetHeader>(
      `
        UPDATE test_sessions
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND status = 'draft'
      `,
      [sessionId],
    );

    await connection.commit();
    return fetchCustomerAssessmentById(customerAccountId, assessmentId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapSubmissionStatusToParticipantStatus(
  invitationStatus: 'draft' | 'invited',
  submissionStatus: 'not_started' | 'in_progress' | 'submitted' | 'scored' | null,
): CustomerAssessmentParticipantStatus {
  if (submissionStatus === 'submitted' || submissionStatus === 'scored') {
    return 'completed';
  }

  if (submissionStatus === 'in_progress') {
    return 'in_progress';
  }

  return invitationStatus;
}

async function fetchParticipantSubmissionMatches(sessionId: number, emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, SubmissionMatchRow>();
  }

  const placeholders = emails.map(() => '?').join(', ');
  const pool = getDbPool();
  const [rows] = await pool.query<SubmissionMatchRow[]>(
    `
      SELECT
        LOWER(p.email) AS email,
        s.status AS submission_status,
        s.submitted_at,
        r.id AS result_id
      FROM participants p
      INNER JOIN submissions s ON s.participant_id = p.id
      LEFT JOIN results r ON r.submission_id = s.id
      WHERE s.test_session_id = ?
        AND LOWER(p.email) IN (${placeholders})
      ORDER BY COALESCE(s.submitted_at, s.updated_at, s.created_at) DESC, s.id DESC
    `,
    [sessionId, ...emails.map((email) => email.toLowerCase())],
  );

  const map = new Map<string, SubmissionMatchRow>();
  for (const row of rows) {
    if (!map.has(row.email)) {
      map.set(row.email, row);
    }
  }

  return map;
}

export async function fetchCustomerAssessmentParticipants(customerAccountId: number, assessmentId: number): Promise<CustomerAssessmentParticipantListResponse | null> {
  const assessment = await fetchCustomerAssessmentById(customerAccountId, assessmentId);
  if (!assessment) {
    return null;
  }

  const pool = getDbPool();
  const [rows] = await pool.query<CustomerAssessmentParticipantRow[]>(
    `
      SELECT
        cap.id,
        cap.full_name,
        cap.email,
        cap.employee_code,
        cap.department,
        cap.position_title,
        cap.note,
        cap.invitation_status,
        cap.invited_via,
        cap.invited_at,
        cap.reminder_count,
        cap.last_reminder_at
      FROM customer_assessment_participants cap
      WHERE cap.customer_assessment_id = ?
      ORDER BY cap.created_at DESC, cap.id DESC
    `,
    [assessmentId],
  );

  const submissionMap = await fetchParticipantSubmissionMatches(
    assessment.sessionId,
    rows.map((row) => row.email),
  );

  const items = rows.map((row) => {
    const match = submissionMap.get(row.email.toLowerCase()) ?? null;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      employeeCode: row.employee_code,
      department: row.department,
      positionTitle: row.position_title,
      note: row.note,
      status: mapSubmissionStatusToParticipantStatus(row.invitation_status, match?.submission_status ?? null),
      invitedVia: row.invited_via,
      invitedAt: toIsoString(row.invited_at),
      reminderCount: Number(row.reminder_count ?? 0),
      lastReminderAt: toIsoString(row.last_reminder_at),
      lastSubmittedAt: toIsoString(match?.submitted_at ?? null),
      submissionStatus: match?.submission_status ?? null,
      resultId: match?.result_id ?? null,
    } satisfies CustomerAssessmentParticipantItem;
  });

  const summary: CustomerAssessmentParticipantSummary = {
    total: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    invited: items.filter((item) => item.status === 'invited').length,
    inProgress: items.filter((item) => item.status === 'in_progress').length,
    completed: items.filter((item) => item.status === 'completed').length,
  };

  return {
    assessmentId,
    shareLink: assessment.participantLink,
    summary,
    items,
  };
}

export async function upsertCustomerAssessmentParticipant(input: {
  customerAccountId: number;
  assessmentId: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
}) {
  const assessment = await fetchCustomerAssessmentById(input.customerAccountId, input.assessmentId);
  if (!assessment) {
    return null;
  }

  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      INSERT INTO customer_assessment_participants (
        customer_assessment_id,
        full_name,
        email,
        employee_code,
        department,
        position_title,
        note,
        invitation_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        employee_code = VALUES(employee_code),
        department = VALUES(department),
        position_title = VALUES(position_title),
        note = VALUES(note),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      input.assessmentId,
      input.fullName.trim(),
      input.email.trim().toLowerCase(),
      input.employeeCode,
      input.department,
      input.positionTitle,
      input.note,
    ],
  );

  const participantList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);
  return participantList?.items.find((item) => item.email.toLowerCase() === input.email.trim().toLowerCase()) ?? null;
}

export async function markCustomerAssessmentParticipantInvited(input: {
  customerAccountId: number;
  assessmentId: number;
  participantRecordId: number;
  channel: CustomerAssessmentInviteChannel;
}) {
  const assessment = await fetchCustomerAssessmentById(input.customerAccountId, input.assessmentId);
  if (!assessment) {
    return null;
  }

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE customer_assessment_participants
      SET invitation_status = 'invited',
          invited_via = ?,
          invited_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_assessment_id = ?
    `,
    [input.channel, input.participantRecordId, input.assessmentId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const participantList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);
  return participantList?.items.find((item) => item.id === input.participantRecordId) ?? null;
}


export async function markCustomerAssessmentParticipantReminded(input: {
  customerAccountId: number;
  assessmentId: number;
  participantRecordId: number;
  channel: CustomerAssessmentInviteChannel;
}) {
  const assessment = await fetchCustomerAssessmentById(input.customerAccountId, input.assessmentId);
  if (!assessment) {
    return null;
  }

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE customer_assessment_participants
      SET invitation_status = 'invited',
          invited_via = ?,
          invited_at = COALESCE(invited_at, CURRENT_TIMESTAMP),
          reminder_count = reminder_count + 1,
          last_reminder_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND customer_assessment_id = ?
    `,
    [input.channel, input.participantRecordId, input.assessmentId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const participantList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);
  return participantList?.items.find((item) => item.id === input.participantRecordId) ?? null;
}
