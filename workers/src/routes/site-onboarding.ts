
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  addBillingCycle,
  buildParticipantLink,
  buildPreviewDemoLink,
  ensureWorkspaceSubscription,
  generateToken,
  getPlanCatalog,
  normalizeEmail,
  parseWorkspaceSettings,
  recordWorkspaceUsageEvent,
  requireActiveCustomer,
  requireWorkspaceRole,
  syncWorkspaceUsageSnapshot,
} from '../lib/customer-workspace';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();
const plans = getPlanCatalog();

const assessmentSchema = z.object({
  testType: z.enum(['iq', 'disc', 'workload', 'custom']),
  title: z.string().min(3).max(150),
  purpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  organizationName: z.string().min(2).max(190),
  administrationMode: z.enum(['supervised', 'remote_unsupervised']).default('remote_unsupervised'),
  timeLimitMinutes: z.coerce.number().int().positive().max(180).nullable().optional(),
  participantLimit: z.coerce.number().int().positive().max(50000).nullable().optional(),
  resultVisibility: z.enum(['participant_summary', 'review_required']),
  protectedDeliveryMode: z.boolean().default(false),
});

const checkoutSchema = z.object({
  selectedPlan: z.enum(['starter', 'growth', 'research']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

const participantSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  employeeCode: z.string().max(100).nullable().optional(),
  department: z.string().max(120).nullable().optional(),
  positionTitle: z.string().max(120).nullable().optional(),
  note: z.string().max(255).nullable().optional(),
});

const importSchema = z.object({
  rows: z.array(participantSchema).min(1).max(250),
});

const sendSchema = z.object({
  channel: z.enum(['email', 'link']).default('email'),
});

function getDefaultTimeLimit(testType: 'iq' | 'disc' | 'workload' | 'custom') {
  if (testType === 'iq') return 20;
  if (testType === 'disc') return 15;
  if (testType === 'workload') return 12;
  return 15;
}

function getParticipantInstructions(testType: 'iq' | 'disc' | 'workload' | 'custom', purpose: string) {
  if (testType === 'iq') {
    return [
      'Read each multiple-choice question carefully before choosing one answer.',
      'Work steadily and avoid leaving the session before you submit.',
      purpose === 'research'
        ? 'This session is configured for structured data collection rather than clinical interpretation.'
        : 'The result is indicative and should be reviewed in the context of the stated assessment purpose.',
    ];
  }

  if (testType === 'disc') {
    return [
      'Choose the statements that are most and least like you in your current context.',
      'Answer honestly rather than selecting what seems ideal.',
      'Profile output is indicative and may require professional review for formal decisions.',
    ];
  }

  if (testType === 'workload') {
    return [
      'Respond based on your recent work experience and current workload perception.',
      'Use the full scale when it reflects your experience.',
      'The summary is intended for structured workload monitoring and follow-up discussion.',
    ];
  }

  return [
    'Read each statement carefully before responding.',
    'Use the full response scale to reflect your current experience.',
    'This custom assessment is configured for structured psychological research and questionnaire data collection.',
  ];
}

function buildSettings(input: {
  workspaceDefaults: ReturnType<typeof parseWorkspaceSettings>;
  organizationName: string;
  purpose: string;
  administrationMode: 'supervised' | 'remote_unsupervised';
  participantLimit: number | null;
  resultVisibility: 'participant_summary' | 'review_required';
  protectedDeliveryMode: boolean;
}) {
  return {
    assessmentPurpose: input.purpose,
    administrationMode: input.administrationMode,
    interpretationMode: input.resultVisibility === 'review_required' ? 'professional_review' : 'self_assessment',
    participantResultMode: input.resultVisibility === 'review_required' ? 'review_required' : 'instant_summary',
    participantLimit: input.participantLimit ?? input.workspaceDefaults.defaultParticipantLimit,
    consentStatement: input.workspaceDefaults.defaultConsentStatement.replaceAll('{organizationName}', input.organizationName),
    privacyStatement: input.workspaceDefaults.defaultPrivacyStatement.replaceAll('{organizationName}', input.organizationName),
    contactPerson: input.workspaceDefaults.contactPerson,
    distributionPolicy: input.resultVisibility === 'review_required' ? 'full_report_with_consent' : 'participant_summary',
    protectedDeliveryMode: input.protectedDeliveryMode,
    participantResultAccess: input.resultVisibility === 'review_required' ? 'full_released' : 'summary',
    hrResultAccess: 'full',
  };
}

async function assertAssessmentCapacity(db: D1Database, accountId: number) {
  const account = await requireActiveCustomer(db, accountId);
  const subscription = await ensureWorkspaceSubscription(db, account);
  const usage = await syncWorkspaceUsageSnapshot(db, accountId, subscription);
  if (usage.activeAssessmentCount >= subscription.assessment_limit) {
    throw new HTTPException(409, { message: 'Assessment limit reached for this workspace plan' });
  }
}

async function assertParticipantCapacity(db: D1Database, accountId: number, additionalParticipants = 1) {
  const account = await requireActiveCustomer(db, accountId);
  const subscription = await ensureWorkspaceSubscription(db, account);
  const usage = await syncWorkspaceUsageSnapshot(db, accountId, subscription);
  if (usage.participantRecordCount + additionalParticipants > subscription.participant_limit) {
    throw new HTTPException(409, { message: 'Participant limit reached for this workspace plan' });
  }
}

function mapAssessmentItem(row: Record<string, unknown>, appOrigin: string) {
  const settings = row.settings_json ? JSON.parse(String(row.settings_json)) : {};
  return {
    assessmentId: Number(row.assessment_id),
    sessionId: Number(row.session_id),
    title: row.title,
    organizationName: row.organization_name_snapshot,
    testType: row.test_type,
    assessmentPurpose: settings.assessmentPurpose ?? 'recruitment',
    administrationMode: settings.administrationMode ?? 'remote_unsupervised',
    resultVisibility: settings.interpretationMode === 'professional_review' ? 'review_required' : 'participant_summary',
    distributionPolicy: settings.distributionPolicy ?? 'participant_summary',
    protectedDeliveryMode: Boolean(settings.protectedDeliveryMode),
    participantResultAccess: settings.participantResultAccess ?? 'summary',
    hrResultAccess: settings.hrResultAccess ?? 'full',
    timeLimitMinutes: row.time_limit_minutes ? Number(row.time_limit_minutes) : null,
    participantLimit: settings.participantLimit ?? null,
    sessionStatus: row.session_status,
    planStatus: row.plan_status,
    participantLink: buildParticipantLink(appOrigin, String(row.access_token)),
    previewDemoLink: buildPreviewDemoLink(appOrigin, row.test_type as 'iq' | 'disc' | 'workload' | 'custom'),
    createdAt: row.created_at,
  };
}

async function fetchAssessmentList(db: D1Database, accountId: number, appOrigin: string) {
  const result = await query(
    db,
    `SELECT ca.id AS assessment_id, ca.test_session_id AS session_id, ca.organization_name_snapshot,
            ca.plan_status, ca.created_at,
            ts.title, ts.test_type, ts.status AS session_status, ts.access_token, ts.time_limit_minutes, ts.settings_json
     FROM customer_assessments ca
     INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
     WHERE ca.customer_account_id = ?
     ORDER BY ca.created_at DESC`,
    [accountId],
  );

  return (result.results ?? []).map((row) => mapAssessmentItem(row as Record<string, unknown>, appOrigin));
}

async function fetchAssessmentDetail(db: D1Database, accountId: number, assessmentId: number, appOrigin: string) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    `SELECT ca.id AS assessment_id, ca.test_session_id AS session_id, ca.organization_name_snapshot,
            ca.plan_status, ca.created_at,
            ts.title, ts.description, ts.test_type, ts.status AS session_status, ts.access_token,
            ts.instructions, ts.time_limit_minutes, ts.settings_json
     FROM customer_assessments ca
     INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
     WHERE ca.customer_account_id = ? AND ca.id = ?
     LIMIT 1`,
    [accountId, assessmentId],
  );

  if (!row) return null;

  const item = mapAssessmentItem(row, appOrigin);
  const settings = row.settings_json ? JSON.parse(String(row.settings_json)) : {};
  return {
    ...item,
    description: row.description ?? null,
    instructions: String(row.instructions ?? '').split('\n').map((value) => value.trim()).filter(Boolean),
    consentStatement: settings.consentStatement ?? '',
    privacyStatement: settings.privacyStatement ?? '',
    contactPerson: settings.contactPerson ?? '',
    interpretationMode: settings.interpretationMode ?? 'self_assessment',
    canActivateSharing: item.sessionStatus === 'draft',
  };
}
async function fetchParticipantList(db: D1Database, accountId: number, assessmentId: number, appOrigin: string) {
  const assessment = await queryOne<Record<string, unknown>>(
    db,
    `SELECT ca.id AS assessment_id, ts.id AS session_id, ts.access_token
     FROM customer_assessments ca
     INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
     WHERE ca.customer_account_id = ? AND ca.id = ?
     LIMIT 1`,
    [accountId, assessmentId],
  );

  if (!assessment) return null;

  const itemsResult = await query(
    db,
    `SELECT cap.id, cap.full_name, cap.email, cap.employee_code, cap.department, cap.position_title, cap.note,
            cap.invitation_status, cap.invited_via, cap.invited_at, cap.reminder_count, cap.last_reminder_at,
            p.id AS participant_id,
            s.id AS submission_id, s.status AS submission_status, s.submitted_at,
            r.id AS result_id
     FROM customer_assessment_participants cap
     LEFT JOIN participants p ON LOWER(p.email) = LOWER(cap.email)
     LEFT JOIN submissions s ON s.participant_id = p.id AND s.session_id = ?
     LEFT JOIN results r ON r.submission_id = s.id
     WHERE cap.customer_assessment_id = ?
     ORDER BY cap.created_at DESC, cap.id DESC`,
    [Number(assessment.session_id), assessmentId],
  );

  const items = (itemsResult.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    const rawSubmissionStatus = item.submission_status ? String(item.submission_status) : null;
    const normalizedSubmissionStatus = rawSubmissionStatus === 'submitted'
      ? 'submitted'
      : rawSubmissionStatus === 'scored'
        ? 'scored'
        : rawSubmissionStatus === 'in_progress'
          ? 'in_progress'
          : null;

    const normalizedStatus = item.invitation_status === 'completed'
      ? 'completed'
      : item.invitation_status === 'invited'
        ? normalizedSubmissionStatus === 'in_progress' ? 'in_progress' : normalizedSubmissionStatus === 'submitted' || normalizedSubmissionStatus === 'scored' ? 'completed' : 'invited'
        : 'draft';

    return {
      id: Number(item.id),
      fullName: item.full_name,
      email: item.email,
      employeeCode: item.employee_code ?? null,
      department: item.department ?? null,
      positionTitle: item.position_title ?? null,
      note: item.note ?? null,
      status: normalizedStatus,
      invitedVia: item.invited_via ?? null,
      invitedAt: item.invited_at ?? null,
      reminderCount: Number(item.reminder_count ?? 0),
      lastReminderAt: item.last_reminder_at ?? null,
      lastSubmittedAt: item.submitted_at ?? null,
      submissionStatus: normalizedSubmissionStatus,
      resultId: item.result_id ? Number(item.result_id) : null,
    };
  });

  return {
    assessmentId,
    shareLink: buildParticipantLink(appOrigin, String(assessment.access_token)),
    summary: {
      total: items.length,
      draft: items.filter((item) => item.status === 'draft').length,
      invited: items.filter((item) => item.status === 'invited').length,
      inProgress: items.filter((item) => item.status === 'in_progress').length,
      completed: items.filter((item) => item.status === 'completed').length,
    },
    items,
  };
}

async function upsertParticipant(db: D1Database, input: {
  accountId: number;
  assessmentId: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
}) {
  const normalized = normalizeEmail(input.email);
  const existing = await queryOne<{ id: number }>(
    db,
    `SELECT cap.id
     FROM customer_assessment_participants cap
     INNER JOIN customer_assessments ca ON ca.id = cap.customer_assessment_id
     WHERE ca.customer_account_id = ? AND cap.customer_assessment_id = ? AND LOWER(cap.email) = ?
     LIMIT 1`,
    [input.accountId, input.assessmentId, normalized],
  );

  if (!existing) {
    await assertParticipantCapacity(db, input.accountId, 1);
    await run(
      db,
      `INSERT INTO customer_assessment_participants (
         customer_assessment_id, full_name, email, employee_code, department, position_title, note,
         invitation_status, invited_via, invited_at, reminder_count, last_reminder_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [input.assessmentId, input.fullName.trim(), normalized, input.employeeCode, input.department, input.positionTitle, input.note],
    );
  } else {
    await run(
      db,
      `UPDATE customer_assessment_participants
       SET full_name = ?, employee_code = ?, department = ?, position_title = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.fullName.trim(), input.employeeCode, input.department, input.positionTitle, input.note, existing.id],
    );
  }

  const participant = await queryOne<Record<string, unknown>>(
    db,
    `SELECT id, full_name, email, employee_code, department, position_title, note,
            invitation_status, invited_via, invited_at, reminder_count, last_reminder_at
     FROM customer_assessment_participants
     WHERE customer_assessment_id = ? AND LOWER(email) = ?
     LIMIT 1`,
    [input.assessmentId, normalized],
  );

  if (!participant) throw new HTTPException(500, { message: 'Participant invite record could not be saved' });

  return {
    id: Number(participant.id),
    fullName: participant.full_name,
    email: participant.email,
    employeeCode: participant.employee_code ?? null,
    department: participant.department ?? null,
    positionTitle: participant.position_title ?? null,
    note: participant.note ?? null,
    status: participant.invitation_status,
    invitedVia: participant.invited_via ?? null,
    invitedAt: participant.invited_at ?? null,
    reminderCount: Number(participant.reminder_count ?? 0),
    lastReminderAt: participant.last_reminder_at ?? null,
    lastSubmittedAt: null,
    submissionStatus: null,
    resultId: null,
  };
}

async function updateParticipantInviteState(db: D1Database, input: {
  accountId: number;
  assessmentId: number;
  participantId: number;
  channel: 'email' | 'link';
  mode: 'invite' | 'remind';
}) {
  const participant = await queryOne<Record<string, unknown>>(
    db,
    `SELECT cap.id, cap.full_name, cap.email, cap.invitation_status, cap.reminder_count
     FROM customer_assessment_participants cap
     INNER JOIN customer_assessments ca ON ca.id = cap.customer_assessment_id
     WHERE ca.customer_account_id = ? AND cap.customer_assessment_id = ? AND cap.id = ?
     LIMIT 1`,
    [input.accountId, input.assessmentId, input.participantId],
  );

  if (!participant) throw new HTTPException(404, { message: 'Participant invite record not found' });

  if (input.mode === 'invite') {
    await run(
      db,
      `UPDATE customer_assessment_participants
       SET invitation_status = 'invited', invited_via = ?, invited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.channel, input.participantId],
    );
  } else {
    await run(
      db,
      `UPDATE customer_assessment_participants
       SET reminder_count = reminder_count + 1, last_reminder_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.participantId],
    );
  }

  return participant;
}

app.use('*', requireCustomer);

app.get('/assessments', async (c) => {
  const payload = c.get('customerPayload');
  return c.json({ items: await fetchAssessmentList(c.env.DB, payload.accountId, c.env.APP_ORIGIN) });
});

app.get('/assessments/:id', async (c) => {
  const payload = c.get('customerPayload');
  const detail = await fetchAssessmentDetail(c.env.DB, payload.accountId, Number(c.req.param('id')), c.env.APP_ORIGIN);
  if (!detail) throw new HTTPException(404, { message: 'Assessment draft not found' });
  return c.json(detail);
});

app.post('/assessments', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator'], 'Assessment operations are limited to owners, workspace admins, and operators');
  const body = assessmentSchema.parse(await c.req.json());
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  await assertAssessmentCapacity(c.env.DB, payload.accountId);

  if (body.organizationName.trim() !== account.organization_name) {
    await run(c.env.DB, `UPDATE customer_accounts SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [body.organizationName.trim(), payload.accountId]);
    account.organization_name = body.organizationName.trim();
  }

  const defaults = parseWorkspaceSettings(account);
  const settings = buildSettings({
    workspaceDefaults: defaults,
    organizationName: body.organizationName.trim(),
    purpose: body.purpose,
    administrationMode: body.administrationMode,
    participantLimit: body.participantLimit ?? null,
    resultVisibility: body.resultVisibility,
    protectedDeliveryMode: body.protectedDeliveryMode,
  });

const timeLimit = body.timeLimitMinutes ?? defaults.defaultTimeLimitMinutes ?? getDefaultTimeLimit(body.testType);
  const instructions = getParticipantInstructions(body.testType, body.purpose).join('\n');
  
  // Resolve test_type_id from test_types table
  const testTypeRow = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM test_types WHERE code = ? LIMIT 1',
    [body.testType],
  );
  
  if (!testTypeRow) {
    throw new HTTPException(400, { message: `Invalid test type: ${body.testType}. Test type not found in database.` });
  }

  const sessionInsert = await run(
    c.env.DB,
    `INSERT INTO test_sessions (
       title, description, test_type_id, test_type, status, access_token,
       time_limit_minutes, settings_json, protected_delivery_mode, instructions,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      body.title.trim(),
      `Draft ${body.testType.toUpperCase()} assessment for ${body.organizationName.trim()} (${body.purpose.replace(/_/g, ' ')}).`,
      testTypeRow.id,
      body.testType,
      generateToken(12),
      timeLimit,
      JSON.stringify(settings),
      body.protectedDeliveryMode ? 1 : 0,
      instructions,
    ],
  );

  const sessionId = Number(sessionInsert.meta.last_row_id);
  const assessmentInsert = await run(
    c.env.DB,
    `INSERT INTO customer_assessments (
       customer_account_id, test_session_id, organization_name_snapshot, onboarding_status, plan_status, created_at, updated_at
     ) VALUES (?, ?, ?, 'ready', 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [payload.accountId, sessionId, body.organizationName.trim()],
  );

  const assessmentId = Number(assessmentInsert.meta.last_row_id);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  await recordWorkspaceUsageEvent(c.env.DB, {
    customerAccountId: payload.accountId,
    workspaceSubscriptionId: subscription.id,
    metricKey: 'assessment_created',
    referenceType: 'customer_assessment',
    referenceId: assessmentId,
    metadata: { sessionId, testType: body.testType, purpose: body.purpose },
  });
  await syncWorkspaceUsageSnapshot(c.env.DB, payload.accountId, subscription);

  const detail = await fetchAssessmentDetail(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  return c.json(detail, 201);
});
app.patch('/assessments/:id', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator'], 'Assessment operations are limited to owners, workspace admins, and operators');
  const assessmentId = Number(c.req.param('id'));
  const body = assessmentSchema.parse(await c.req.json());
  const existing = await queryOne<Record<string, unknown>>(
    c.env.DB,
    `SELECT ca.id, ts.id AS session_id, ts.status AS session_status
     FROM customer_assessments ca
     INNER JOIN test_sessions ts ON ts.id = ca.test_session_id
     WHERE ca.customer_account_id = ? AND ca.id = ?
     LIMIT 1`,
    [payload.accountId, assessmentId],
  );
  if (!existing) throw new HTTPException(404, { message: 'Assessment draft not found' });
  if (existing.session_status !== 'draft') throw new HTTPException(409, { message: 'Only draft assessments can be edited' });

  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const defaults = parseWorkspaceSettings(account);
  const settings = buildSettings({
    workspaceDefaults: defaults,
    organizationName: body.organizationName.trim(),
    purpose: body.purpose,
    administrationMode: body.administrationMode,
    participantLimit: body.participantLimit ?? null,
    resultVisibility: body.resultVisibility,
    protectedDeliveryMode: body.protectedDeliveryMode,
  });

  // Resolve test_type_id from test_types table
  const testTypeRow = await queryOne<{ id: number }>(
    c.env.DB,
    'SELECT id FROM test_types WHERE code = ? LIMIT 1',
    [body.testType],
  );
  
  if (!testTypeRow) {
    throw new HTTPException(400, { message: `Invalid test type: ${body.testType}. Test type not found in database.` });
  }

  const timeLimit = body.timeLimitMinutes ?? defaults.defaultTimeLimitMinutes ?? getDefaultTimeLimit(body.testType);
  const instructions = getParticipantInstructions(body.testType, body.purpose).join('\n');

  await run(c.env.DB, `UPDATE customer_accounts SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [body.organizationName.trim(), payload.accountId]);
  await run(c.env.DB, `UPDATE customer_assessments SET organization_name_snapshot = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?`, [body.organizationName.trim(), assessmentId, payload.accountId]);
  await run(
    c.env.DB,
    `UPDATE test_sessions
     SET title = ?, description = ?, test_type_id = ?, test_type = ?, time_limit_minutes = ?, settings_json = ?, protected_delivery_mode = ?, instructions = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      body.title.trim(),
      `Draft ${body.testType.toUpperCase()} assessment for ${body.organizationName.trim()} (${body.purpose.replace(/_/g, ' ')}).`,
      testTypeRow.id,
      body.testType,
      timeLimit,
      JSON.stringify(settings),
      body.protectedDeliveryMode ? 1 : 0,
      instructions,
      Number(existing.session_id),
    ],
  );

  const detail = await fetchAssessmentDetail(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  return c.json(detail);
});

app.post('/assessments/:id/activate', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  const currentPeriodEnd = addBillingCycle(subscription.billing_cycle);

  await run(c.env.DB, `UPDATE workspace_subscriptions SET status = CASE WHEN status = 'trial' THEN 'active' ELSE status END, trial_ends_at = CASE WHEN status = 'trial' THEN NULL ELSE trial_ends_at END, renews_at = ?, current_period_start = COALESCE(current_period_start, CURRENT_TIMESTAMP), current_period_end = COALESCE(current_period_end, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [currentPeriodEnd, currentPeriodEnd, subscription.id]);
  await run(c.env.DB, `UPDATE test_sessions SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT test_session_id FROM customer_assessments WHERE id = ? AND customer_account_id = ?)`, [assessmentId, payload.accountId]);
  await run(c.env.DB, `UPDATE customer_assessments SET plan_status = 'upgraded', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?`, [assessmentId, payload.accountId]);

  const detail = await fetchAssessmentDetail(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!detail) throw new HTTPException(404, { message: 'Assessment draft not found' });
  return c.json(detail);
});

app.post('/assessments/:id/checkout', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const body = checkoutSchema.parse(await c.req.json());
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  const plan = plans[body.selectedPlan];
  const currentPeriodEnd = addBillingCycle(body.billingCycle);

  await run(
    c.env.DB,
    `UPDATE workspace_subscriptions
     SET plan_code = ?, status = 'active', billing_cycle = ?, billing_provider = 'dummy',
         assessment_limit = ?, participant_limit = ?, team_member_limit = ?, trial_ends_at = NULL,
         renews_at = ?, current_period_start = CURRENT_TIMESTAMP, current_period_end = ?,
         plan_version = plan_version + 1, billing_contact_email = COALESCE(billing_contact_email, ?), updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [body.selectedPlan, body.billingCycle, plan.assessmentLimit, plan.participantLimit, plan.teamMemberLimit, currentPeriodEnd, currentPeriodEnd, account.email, subscription.id],
  );

  await run(c.env.DB, `INSERT INTO billing_checkout_sessions (customer_account_id, workspace_subscription_id, session_key, billing_provider, plan_code, billing_cycle, status, checkout_url, expires_at, completed_at, metadata_json, created_at, updated_at) VALUES (?, ?, ?, 'dummy', ?, ?, 'completed', NULL, NULL, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [payload.accountId, subscription.id, generateToken(12), body.selectedPlan, body.billingCycle, JSON.stringify({ mode: 'dummy', triggeredBy: 'assessment_checkout' })]);
  const checkoutSessionId = Number((await queryOne<{ id: number }>(c.env.DB, 'SELECT id FROM billing_checkout_sessions ORDER BY id DESC LIMIT 1'))?.id ?? 0);
  await run(c.env.DB, `INSERT INTO billing_invoices (customer_account_id, workspace_subscription_id, checkout_session_id, invoice_number, status, currency_code, amount_subtotal, amount_total, issued_at, paid_at, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'paid', 'USD', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [payload.accountId, subscription.id, checkoutSessionId || null, `INV-${subscription.id}-${Date.now()}`, plan[body.billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'], plan[body.billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'], JSON.stringify({ mode: 'dummy', selectedPlan: body.selectedPlan, billingCycle: body.billingCycle })]);
  await run(c.env.DB, `UPDATE test_sessions SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT test_session_id FROM customer_assessments WHERE id = ? AND customer_account_id = ?)`, [assessmentId, payload.accountId]);
  await run(c.env.DB, `UPDATE customer_assessments SET plan_status = 'upgraded', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?`, [assessmentId, payload.accountId]);

  const detail = await fetchAssessmentDetail(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!detail) throw new HTTPException(404, { message: 'Assessment draft not found' });
  return c.json(detail);
});

app.get('/assessments/:id/participants', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const list = await fetchParticipantList(c.env.DB, payload.accountId, Number(c.req.param('id')), c.env.APP_ORIGIN);
  if (!list) throw new HTTPException(404, { message: 'Assessment draft not found' });
  return c.json(list);
});

app.post('/assessments/:id/participants', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const body = participantSchema.parse(await c.req.json());
  const participant = await upsertParticipant(c.env.DB, {
    accountId: payload.accountId,
    assessmentId,
    fullName: body.fullName,
    email: body.email,
    employeeCode: body.employeeCode ?? null,
    department: body.department ?? null,
    positionTitle: body.positionTitle ?? null,
    note: body.note ?? null,
  });

  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  await recordWorkspaceUsageEvent(c.env.DB, {
    customerAccountId: payload.accountId,
    workspaceSubscriptionId: subscription.id,
    metricKey: 'participant_added',
    referenceType: 'customer_assessment_participant',
    referenceId: participant.id,
    metadata: { assessmentId, email: participant.email },
  });
  await syncWorkspaceUsageSnapshot(c.env.DB, payload.accountId, subscription);

  return c.json(participant, 201);
});

app.post('/assessments/:id/participants/import', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const body = importSchema.parse(await c.req.json());
  const uniqueRows = new Map<string, z.infer<typeof participantSchema>>();
  for (const row of body.rows) uniqueRows.set(normalizeEmail(row.email), row);

  let importedCount = 0;
  let updatedCount = 0;
  for (const row of uniqueRows.values()) {
    const existing = await queryOne<{ id: number }>(c.env.DB, 'SELECT id FROM customer_assessment_participants WHERE customer_assessment_id = ? AND LOWER(email) = ? LIMIT 1', [assessmentId, normalizeEmail(row.email)]);
    await upsertParticipant(c.env.DB, {
      accountId: payload.accountId,
      assessmentId,
      fullName: row.fullName,
      email: row.email,
      employeeCode: row.employeeCode ?? null,
      department: row.department ?? null,
      positionTitle: row.positionTitle ?? null,
      note: row.note ?? null,
    });
    if (existing) updatedCount += 1; else importedCount += 1;
  }

  return c.json({ importedCount, updatedCount, totalRows: uniqueRows.size }, 201);
});
app.post('/assessments/:id/participants/send-bulk', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const body = sendSchema.parse(await c.req.json());
  const list = await fetchParticipantList(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!list) throw new HTTPException(404, { message: 'Assessment draft not found' });
  const targets = list.items.filter((item) => item.status === 'draft');
  for (const target of targets) {
    await updateParticipantInviteState(c.env.DB, { accountId: payload.accountId, assessmentId, participantId: target.id, channel: body.channel, mode: 'invite' });
  }
  return c.json({
    invitedCount: targets.length,
    skippedCount: list.items.length - targets.length,
    shareLink: list.shareLink,
    deliveryPreview: body.channel === 'email' ? `Dummy email invites queued for ${targets.length} participant(s). Share link: ${list.shareLink}` : `Share this link with ${targets.length} participant(s): ${list.shareLink}`,
  });
});

app.post('/assessments/:id/participants/remind-bulk', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const body = sendSchema.parse(await c.req.json());
  const list = await fetchParticipantList(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!list) throw new HTTPException(404, { message: 'Assessment draft not found' });
  const targets = list.items.filter((item) => item.status === 'invited' || item.status === 'in_progress');
  for (const target of targets) {
    await updateParticipantInviteState(c.env.DB, { accountId: payload.accountId, assessmentId, participantId: target.id, channel: body.channel, mode: 'remind' });
  }
  return c.json({
    remindedCount: targets.length,
    skippedCount: list.items.length - targets.length,
    shareLink: list.shareLink,
    deliveryPreview: body.channel === 'email' ? `Dummy reminder emails queued for ${targets.length} participant(s). Share link: ${list.shareLink}` : `Reminder links prepared for ${targets.length} participant(s): ${list.shareLink}`,
  });
});

app.post('/assessments/:id/participants/:participantId/send', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const participantId = Number(c.req.param('participantId'));
  const body = sendSchema.parse(await c.req.json());
  const existing = await updateParticipantInviteState(c.env.DB, { accountId: payload.accountId, assessmentId, participantId, channel: body.channel, mode: 'invite' });
  const list = await fetchParticipantList(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!list) throw new HTTPException(404, { message: 'Assessment draft not found' });
  const participant = list.items.find((item) => item.id === participantId) ?? null;
  return c.json({
    participant,
    shareLink: list.shareLink,
    deliveryPreview: body.channel === 'email' ? `Dummy email queued for ${existing.email}. Share link: ${list.shareLink}` : `Share this link with ${existing.full_name}: ${list.shareLink}`,
  });
});

app.post('/assessments/:id/participants/:participantId/remind', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin', 'operator']);
  const assessmentId = Number(c.req.param('id'));
  const participantId = Number(c.req.param('participantId'));
  const body = sendSchema.parse(await c.req.json());
  const existing = await updateParticipantInviteState(c.env.DB, { accountId: payload.accountId, assessmentId, participantId, channel: body.channel, mode: 'remind' });
  const list = await fetchParticipantList(c.env.DB, payload.accountId, assessmentId, c.env.APP_ORIGIN);
  if (!list) throw new HTTPException(404, { message: 'Assessment draft not found' });
  const participant = list.items.find((item) => item.id === participantId) ?? null;
  return c.json({
    participant,
    shareLink: list.shareLink,
    deliveryPreview: body.channel === 'email' ? `Dummy reminder queued for ${existing.email}. Share link: ${list.shareLink}` : `Share this reminder link with ${existing.full_name}: ${list.shareLink}`,
  });
});

export default app;
