import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import { getDefaultTestSessionSettings, parseTestSessionSettings } from '../test-sessions/session-settings.js';

const SESSION_DEFAULTS_KEY = 'session_defaults';

interface AdminProfileRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  role: 'super_admin' | 'admin';
  last_login_at: Date | string | null;
  created_at: Date | string;
}

interface AppSettingRow extends RowDataPacket {
  setting_key: string;
  setting_value_json: string | Record<string, unknown>;
}

interface AuditLogRow extends RowDataPacket {
  id: number;
  actor_type: 'admin' | 'participant' | 'system';
  actor_admin_id: number | null;
  entity_type: string;
  entity_id: number | null;
  action: string;
  metadata_json: string | Record<string, unknown> | null;
  created_at: Date | string;
  actor_name: string | null;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeJson(value: string | Record<string, unknown> | null) {
  if (!value) {
    return {};
  }

  return typeof value === 'string' ? (JSON.parse(value) as Record<string, unknown>) : value;
}

function getDefaultSessionDefaults() {
  const defaults = getDefaultTestSessionSettings();

  return {
    timeLimitMinutes: 15,
    descriptionTemplate: 'Use this assessment session to gather structured psychological screening data for the selected purpose.',
    instructions: [
      'Read each question carefully before responding.',
      'Answer honestly and complete the assessment in one sitting.',
      'Contact the listed administrator if you need clarification before submitting.',
    ],
    settings: {
      assessmentPurpose: defaults.assessmentPurpose,
      administrationMode: defaults.administrationMode,
      interpretationMode: defaults.interpretationMode,
      participantLimit: defaults.participantLimit,
      consentStatement: defaults.consentStatement,
      privacyStatement: defaults.privacyStatement,
      contactPerson: defaults.contactPerson,
    },
  };
}

export async function fetchAdminProfile(adminId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<AdminProfileRow[]>(
    `
      SELECT id, full_name, email, role, last_login_at, created_at
      FROM admins
      WHERE id = ?
      LIMIT 1
    `,
    [adminId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    lastLoginAt: toIsoString(row.last_login_at),
    createdAt: toIsoString(row.created_at),
  };
}

export async function updateAdminProfileRecord(adminId: number, input: { fullName: string; email: string }) {
  const pool = getDbPool();
  await pool.query<ResultSetHeader>(
    `
      UPDATE admins
      SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.fullName.trim(), input.email.trim().toLowerCase(), adminId],
  );

  return fetchAdminProfile(adminId);
}

export async function fetchSessionDefaults() {
  const pool = getDbPool();
  const [rows] = await pool.query<AppSettingRow[]>(
    'SELECT setting_key, setting_value_json FROM app_settings WHERE setting_key = ? LIMIT 1',
    [SESSION_DEFAULTS_KEY],
  );

  if (!rows[0]) {
    return getDefaultSessionDefaults();
  }

  const payload = normalizeJson(rows[0].setting_value_json);
  const defaults = getDefaultSessionDefaults();
  const settings = parseTestSessionSettings(payload.settings as Record<string, unknown> | null);
  const instructions = Array.isArray(payload.instructions)
    ? payload.instructions.map((item) => String(item).trim()).filter(Boolean)
    : defaults.instructions;

  return {
    timeLimitMinutes:
      typeof payload.timeLimitMinutes === 'number' && Number.isFinite(payload.timeLimitMinutes)
        ? payload.timeLimitMinutes
        : defaults.timeLimitMinutes,
    descriptionTemplate:
      typeof payload.descriptionTemplate === 'string' && payload.descriptionTemplate.trim().length > 0
        ? payload.descriptionTemplate.trim()
        : defaults.descriptionTemplate,
    instructions,
    settings: {
      assessmentPurpose: settings.assessmentPurpose,
      administrationMode: settings.administrationMode,
      interpretationMode: settings.interpretationMode,
      participantLimit: settings.participantLimit,
      consentStatement: settings.consentStatement,
      privacyStatement: settings.privacyStatement,
      contactPerson: settings.contactPerson,
    },
  };
}

export async function saveSessionDefaults(input: {
  timeLimitMinutes: number;
  descriptionTemplate: string;
  instructions: string[];
  settings: {
    assessmentPurpose: 'recruitment' | 'employee_development' | 'academic_evaluation' | 'research' | 'self_assessment';
    administrationMode: 'supervised' | 'remote_unsupervised';
    interpretationMode: 'self_assessment' | 'professional_review';
    participantLimit: number | null;
    consentStatement: string;
    privacyStatement: string;
    contactPerson: string;
  };
}) {
  const pool = getDbPool();
  const payload = JSON.stringify({
    timeLimitMinutes: input.timeLimitMinutes,
    descriptionTemplate: input.descriptionTemplate.trim(),
    instructions: input.instructions.map((item) => item.trim()).filter(Boolean),
    settings: input.settings,
  });

  await pool.query<ResultSetHeader>(
    `
      INSERT INTO app_settings (setting_key, setting_value_json)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value_json = VALUES(setting_value_json),
        updated_at = CURRENT_TIMESTAMP
    `,
    [SESSION_DEFAULTS_KEY, payload],
  );

  return fetchSessionDefaults();
}

export async function fetchAuditLogFeed(limit = 12) {
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const [rows] = await pool.query<AuditLogRow[]>(
    `
      SELECT
        al.id,
        al.actor_type,
        al.actor_admin_id,
        al.entity_type,
        al.entity_id,
        al.action,
        al.metadata_json,
        al.created_at,
        a.full_name AS actor_name
      FROM audit_logs al
      LEFT JOIN admins a ON a.id = al.actor_admin_id
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT ${safeLimit}
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    actorType: row.actor_type,
    actorAdminId: row.actor_admin_id,
    actorName: row.actor_name,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    metadata: normalizeJson(row.metadata_json),
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
  }));
}
