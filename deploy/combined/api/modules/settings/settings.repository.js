import { getDbPool } from '../../database/mysql.js';
import { getDefaultTestSessionSettings, parseTestSessionSettings } from '../test-sessions/session-settings.js';
const SESSION_DEFAULTS_KEY = 'session_defaults';
function toIsoString(value) {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function normalizeJson(value) {
    if (!value) {
        return {};
    }
    return typeof value === 'string' ? JSON.parse(value) : value;
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
export async function fetchAdminProfile(adminId) {
    const pool = getDbPool();
    const [rows] = await pool.query(`
      SELECT id, full_name, email, role, last_login_at, created_at
      FROM admins
      WHERE id = ?
      LIMIT 1
    `, [adminId]);
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
export async function updateAdminProfileRecord(adminId, input) {
    const pool = getDbPool();
    await pool.query(`
      UPDATE admins
      SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [input.fullName.trim(), input.email.trim().toLowerCase(), adminId]);
    return fetchAdminProfile(adminId);
}
export async function fetchSessionDefaults() {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT setting_key, setting_value_json FROM app_settings WHERE setting_key = ? LIMIT 1', [SESSION_DEFAULTS_KEY]);
    if (!rows[0]) {
        return getDefaultSessionDefaults();
    }
    const payload = normalizeJson(rows[0].setting_value_json);
    const defaults = getDefaultSessionDefaults();
    const settings = parseTestSessionSettings(payload.settings);
    const instructions = Array.isArray(payload.instructions)
        ? payload.instructions.map((item) => String(item).trim()).filter(Boolean)
        : defaults.instructions;
    return {
        timeLimitMinutes: typeof payload.timeLimitMinutes === 'number' && Number.isFinite(payload.timeLimitMinutes)
            ? payload.timeLimitMinutes
            : defaults.timeLimitMinutes,
        descriptionTemplate: typeof payload.descriptionTemplate === 'string' && payload.descriptionTemplate.trim().length > 0
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
export async function saveSessionDefaults(input) {
    const pool = getDbPool();
    const payload = JSON.stringify({
        timeLimitMinutes: input.timeLimitMinutes,
        descriptionTemplate: input.descriptionTemplate.trim(),
        instructions: input.instructions.map((item) => item.trim()).filter(Boolean),
        settings: input.settings,
    });
    await pool.query(`
      INSERT INTO app_settings (setting_key, setting_value_json)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value_json = VALUES(setting_value_json),
        updated_at = CURRENT_TIMESTAMP
    `, [SESSION_DEFAULTS_KEY, payload]);
    return fetchSessionDefaults();
}
export async function fetchAuditLogFeed(limit = 12) {
    const pool = getDbPool();
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const [rows] = await pool.query(`
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
    `);
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
