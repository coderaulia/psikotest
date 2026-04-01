import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

const SESSION_DEFAULTS_KEY = 'session_defaults';

function getDefaultSessionDefaults() {
  return {
    timeLimitMinutes: 15,
    descriptionTemplate: 'Use this assessment session to gather structured psychological screening data for the selected purpose.',
    instructions: [
      'Read each question carefully before responding.',
      'Answer honestly and complete the assessment in one sitting.',
      'Contact the listed administrator if you need clarification before submitting.',
    ],
    settings: {
      assessmentPurpose: 'recruitment' as const,
      administrationMode: 'remote_unsupervised' as const,
      interpretationMode: 'professional_review' as const,
      participantLimit: null as number | null,
      consentStatement: 'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
      privacyStatement: 'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
      contactPerson: 'HR Assessment Desk',
      distributionPolicy: 'participant_summary' as const,
      protectedDeliveryMode: false,
      participantResultAccess: 'summary' as const,
      hrResultAccess: 'full' as const,
    },
  };
}

function parseJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function fetchAdminProfile(db: D1Database, adminId: number) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    'SELECT id, full_name, email, role, last_login_at, created_at FROM admins WHERE id = ? LIMIT 1',
    [adminId],
  );

  if (!row) return null;

  return {
    id: Number(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    role: row.role as 'super_admin' | 'admin' | 'psychologist_reviewer',
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

async function fetchSessionDefaults(db: D1Database) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    'SELECT setting_value_json FROM app_settings WHERE setting_key = ? LIMIT 1',
    [SESSION_DEFAULTS_KEY],
  );

  if (!row || !row.setting_value_json) {
    return getDefaultSessionDefaults();
  }

  const payload = parseJson(String(row.setting_value_json));
  if (!payload || typeof payload !== 'object') {
    return getDefaultSessionDefaults();
  }

  const defaults = getDefaultSessionDefaults();
  const settings = payload.settings as Record<string, unknown> | null;

  return {
    timeLimitMinutes: typeof payload.timeLimitMinutes === 'number' ? payload.timeLimitMinutes : defaults.timeLimitMinutes,
    descriptionTemplate: typeof payload.descriptionTemplate === 'string' ? payload.descriptionTemplate : defaults.descriptionTemplate,
    instructions: Array.isArray(payload.instructions) ? payload.instructions.map(String).filter(Boolean) : defaults.instructions,
    settings: {
      assessmentPurpose: (settings?.assessmentPurpose as string) || defaults.settings.assessmentPurpose,
      administrationMode: (settings?.administrationMode as string) || defaults.settings.administrationMode,
      interpretationMode: (settings?.interpretationMode as string) || defaults.settings.interpretationMode,
      participantLimit: typeof settings?.participantLimit === 'number' ? settings.participantLimit : null,
      consentStatement: (settings?.consentStatement as string) || defaults.settings.consentStatement,
      privacyStatement: (settings?.privacyStatement as string) || defaults.settings.privacyStatement,
      contactPerson: (settings?.contactPerson as string) || defaults.settings.contactPerson,
      distributionPolicy: (settings?.distributionPolicy as string) || defaults.settings.distributionPolicy,
      protectedDeliveryMode: typeof settings?.protectedDeliveryMode === 'boolean' ? settings.protectedDeliveryMode : false,
      participantResultAccess: (settings?.participantResultAccess as string) || defaults.settings.participantResultAccess,
      hrResultAccess: (settings?.hrResultAccess as string) || defaults.settings.hrResultAccess,
    },
  };
}

async function fetchAuditFeed(db: D1Database, limit = 12) {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const rows = await query(
    db,
    `SELECT
      al.id,
      al.actor_type,
      al.actor_admin_id,
      al.entity_type,
      al.entity_id,
      al.action,
      al.metadata_json,
      al.created_at,
      a.full_name AS actor_name
    FROM audit_events al
    LEFT JOIN admins a ON a.id = al.actor_admin_id
    ORDER BY al.created_at DESC, al.id DESC
    LIMIT ?`,
    [safeLimit],
  );

  return (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      actorType: row.actor_type as string,
      actorAdminId: row.actor_admin_id ? Number(row.actor_admin_id) : null,
      actorName: row.actor_name ? String(row.actor_name) : null,
      entityType: row.entity_type as string,
      entityId: row.entity_id ? Number(row.entity_id) : null,
      action: row.action as string,
      metadata: parseJson(String(row.metadata_json ?? '{}')) || {},
      createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    };
  });
}

app.use('*', requireAdmin);

app.get('/', async (c) => {
  const payload = c.get('adminPayload');
  const [profile, sessionDefaults, auditFeed] = await Promise.all([
    fetchAdminProfile(c.env.DB, payload.adminId),
    fetchSessionDefaults(c.env.DB),
    fetchAuditFeed(c.env.DB),
  ]);

  if (!profile) {
    return c.json({ error: 'Admin profile not found' }, 404);
  }

  return c.json({ profile, sessionDefaults, auditFeed });
});

const profileSchema = z.object({
  fullName: z.string().min(3).max(150),
  email: z.string().email().max(190),
});

app.patch('/profile', async (c) => {
  const payload = c.get('adminPayload');
  const body = await c.req.json();
  const { fullName, email } = profileSchema.parse(body);

  await run(
    c.env.DB,
    'UPDATE admins SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [fullName.trim(), email.trim().toLowerCase(), payload.adminId],
  );

  const profile = await fetchAdminProfile(c.env.DB, payload.adminId);

  await run(
    c.env.DB,
    `INSERT INTO audit_events (actor_type, actor_admin_id, entity_type, entity_id, action, metadata_json, created_at)
     VALUES ('admin', ?, 'admin_profile', ?, 'admin_profile.updated', ?, CURRENT_TIMESTAMP)`,
    [payload.adminId, payload.adminId, JSON.stringify({ email: email.trim().toLowerCase() })],
  );

  return c.json(profile);
});

const sessionDefaultsSchema = z.object({
  timeLimitMinutes: z.number().int().positive().max(180),
  descriptionTemplate: z.string().min(10).max(1000),
  instructions: z.array(z.string().min(3).max(500)).min(1).max(12),
  settings: z.object({
    assessmentPurpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
    administrationMode: z.enum(['supervised', 'remote_unsupervised']),
    interpretationMode: z.enum(['self_assessment', 'professional_review']),
    participantLimit: z.number().int().positive().max(50000).nullable(),
    consentStatement: z.string().min(20).max(2000),
    privacyStatement: z.string().min(20).max(2000),
    contactPerson: z.string().min(3).max(255),
    distributionPolicy: z.enum(['hr_only', 'participant_summary', 'full_report_with_consent']).optional().default('participant_summary'),
    protectedDeliveryMode: z.boolean().optional().default(false),
    participantResultAccess: z.enum(['none', 'summary', 'full_released']).optional().default('summary'),
    hrResultAccess: z.enum(['none', 'summary', 'full']).optional().default('full'),
  }),
});

app.patch('/session-defaults', async (c) => {
  const payload = c.get('adminPayload');
  const body = await c.req.json();
  const parsed = sessionDefaultsSchema.parse(body);

  const settingsPayload = {
    timeLimitMinutes: parsed.timeLimitMinutes,
    descriptionTemplate: parsed.descriptionTemplate.trim(),
    instructions: parsed.instructions.map((s) => s.trim()).filter(Boolean),
    settings: {
      assessmentPurpose: parsed.settings.assessmentPurpose,
      administrationMode: parsed.settings.administrationMode,
      interpretationMode: parsed.settings.interpretationMode,
      participantLimit: parsed.settings.participantLimit,
      consentStatement: parsed.settings.consentStatement,
      privacyStatement: parsed.settings.privacyStatement,
      contactPerson: parsed.settings.contactPerson,
      distributionPolicy: parsed.settings.distributionPolicy,
      protectedDeliveryMode: parsed.settings.protectedDeliveryMode,
      participantResultAccess: parsed.settings.participantResultAccess,
      hrResultAccess: parsed.settings.hrResultAccess,
    },
  };

  await run(
    c.env.DB,
    `INSERT INTO app_settings (setting_key, setting_value_json, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value_json = excluded.setting_value_json, updated_at = CURRENT_TIMESTAMP`,
    [SESSION_DEFAULTS_KEY, JSON.stringify(settingsPayload)],
  );

  const sessionDefaults = await fetchSessionDefaults(c.env.DB);

  await run(
    c.env.DB,
    `INSERT INTO audit_events (actor_type, actor_admin_id, entity_type, entity_id, action, metadata_json, created_at)
     VALUES ('admin', ?, 'app_settings', NULL, 'session_defaults.updated', ?, CURRENT_TIMESTAMP)`,
    [payload.adminId, JSON.stringify({
      assessmentPurpose: parsed.settings.assessmentPurpose,
      interpretationMode: parsed.settings.interpretationMode,
      participantLimit: parsed.settings.participantLimit,
    })],
  );

  return c.json(sessionDefaults);
});

export default app;