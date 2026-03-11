import { randomBytes } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import {
  type TestSessionSettings,
  parseTestSessionSettings,
} from './session-settings.js';

export type TestSessionStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ResultReviewStatus = 'preliminary' | 'reviewed';

export interface TestSessionListFilters {
  search?: string;
  testType?: PublicTestTypeCode;
  status?: TestSessionStatus;
  limit?: number;
}

export interface SessionParticipantProgressItem {
  submissionId: number;
  participantId: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  attemptNo: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  startedAt: string | null;
  submittedAt: string | null;
  resultId: number | null;
  scoreTotal: number | null;
  scoreBand: string | null;
  profileCode: string | null;
  reviewStatus: ResultReviewStatus | null;
}

export interface TestSessionListItem {
  id: number;
  title: string;
  description: string | null;
  testType: PublicTestTypeCode;
  status: TestSessionStatus;
  accessToken: string;
  participantCount: number;
  completedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  timeLimitMinutes: number | null;
  settings: TestSessionSettings;
}

export interface TestSessionDetail extends TestSessionListItem {
  instructions: string[];
  completionRate: number;
  participants: SessionParticipantProgressItem[];
}

export interface CreateTestSessionInput {
  title: string;
  testType: PublicTestTypeCode;
  description?: string;
  instructions?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeLimitMinutes?: number;
  status: 'draft' | 'active';
  settings: TestSessionSettings;
  createdByAdminId: number;
}

export interface UpdateTestSessionInput {
  title: string;
  description?: string;
  instructions?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeLimitMinutes?: number;
  status: TestSessionStatus;
  settings: TestSessionSettings;
}

interface SessionSummaryRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  test_type: PublicTestTypeCode;
  status: TestSessionStatus;
  access_token: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  settings_json: string | Record<string, unknown> | null;
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  participant_count: number;
  completed_count: number;
}

interface SessionParticipantRow extends RowDataPacket {
  submission_id: number;
  participant_id: number;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  position_title: string | null;
  attempt_no: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  started_at: string | Date | null;
  submitted_at: string | Date | null;
  result_id: number | null;
  score_total: number | null;
  score_band: string | null;
  profile_code: string | null;
  result_payload_json: string | Record<string, unknown> | null;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseInstructions(instructions: string | null) {
  return (instructions ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseReviewStatus(payload: string | Record<string, unknown> | null): ResultReviewStatus {
  if (!payload) {
    return 'preliminary';
  }

  const normalized = typeof payload === 'string'
    ? (JSON.parse(payload) as Record<string, unknown>)
    : payload;

  return normalized.reviewStatus === 'reviewed' ? 'reviewed' : 'preliminary';
}

function mapSessionSummary(row: SessionSummaryRow): TestSessionListItem {
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

function buildSummaryQuery(filters: TestSessionListFilters = {}) {
  const conditions: string[] = [];
  const params: Array<string> = [];

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

export async function fetchTestSessions(filters: TestSessionListFilters = {}) {
  const pool = getDbPool();
  const { query, params } = buildSummaryQuery(filters);
  const [rows] = await pool.query<SessionSummaryRow[]>(query, params);
  return rows.map(mapSessionSummary);
}

export async function fetchTestSessionById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<SessionSummaryRow[]>(
    `
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
    `,
    [id],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const [participantRows] = await pool.query<SessionParticipantRow[]>(
    `
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
    `,
    [id],
  );

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
    } satisfies SessionParticipantProgressItem)),
  } satisfies TestSessionDetail;
}

export async function createTestSessionRecord(input: CreateTestSessionInput) {
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

    const accessToken = createAccessToken(input.testType, input.title);
    const [insertResult] = await connection.query<ResultSetHeader>(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
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
      ],
    );

    await connection.commit();
    return fetchTestSessionById(insertResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTestSessionRecord(id: number, input: UpdateTestSessionInput) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
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
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.instructions?.trim() ? input.instructions.trim() : null,
      JSON.stringify(input.settings),
      input.timeLimitMinutes ?? null,
      input.status,
      input.startsAt ? new Date(input.startsAt) : null,
      input.endsAt ? new Date(input.endsAt) : null,
      id,
    ],
  );

  return fetchTestSessionById(id);
}
