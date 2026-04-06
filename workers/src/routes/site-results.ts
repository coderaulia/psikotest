import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { query, queryOne, run } from '../lib/db';
import { ensureWorkspaceSubscription, recordWorkspaceUsageEvent, requireActiveCustomer } from '../lib/customer-workspace';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();

function escapeCsvValue(value: string | number | null) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).replace(/"/g, '""');
  return /[",\r\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

async function fetchWorkspaceResults(db: D1Database, accountId: number) {
  const result = await query(
    db,
    `SELECT r.id AS result_id, ca.id AS assessment_id, ts.title AS assessment_title,
            p.full_name AS participant_name, p.email AS participant_email,
            COALESCE(ts.test_type, r.test_type) AS test_type,
            s.submitted_at, r.score_total, r.score_band, r.profile_code,
            r.review_status, r.professional_summary, r.recommendation, r.limitations,
            r.result_payload_json, ts.settings_json, ts.status AS session_status
     FROM results r
     INNER JOIN submissions s ON s.id = r.submission_id
     INNER JOIN participants p ON p.id = s.participant_id
     INNER JOIN test_sessions ts ON ts.id = s.session_id
     INNER JOIN customer_assessments ca ON ca.test_session_id = ts.id
     WHERE ca.customer_account_id = ?
     ORDER BY s.submitted_at DESC, r.id DESC`,
    [accountId],
  );

  return (result.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    const settings = item.settings_json ? JSON.parse(String(item.settings_json)) : {};
    const payload = item.result_payload_json ? JSON.parse(String(item.result_payload_json)) : {};
    const isReleased = item.review_status === 'released';
    return {
      resultId: Number(item.result_id),
      assessmentId: Number(item.assessment_id),
      assessmentTitle: item.assessment_title,
      participantName: item.participant_name,
      participantEmail: item.participant_email,
      testType: item.test_type,
      submittedAt: item.submitted_at,
      scoreTotal: item.score_total != null ? Number(item.score_total) : null,
      scoreBand: item.score_band ?? null,
      profileCode: item.profile_code ?? null,
      reviewStatus: item.review_status ?? 'scored_preliminary',
      distributionPolicy: settings.distributionPolicy ?? 'participant_summary',
      participantResultAccess: settings.participantResultAccess ?? 'summary',
      hrResultAccess: settings.hrResultAccess ?? 'full',
      protectedDeliveryMode: Boolean(settings.protectedDeliveryMode),
      releasedSummary: isReleased ? item.professional_summary ?? payload.professionalSummary ?? null : null,
      releasedRecommendation: isReleased ? item.recommendation ?? payload.recommendation ?? null : null,
      releasedLimitations: isReleased ? item.limitations ?? payload.limitations ?? null : null,
      visibilityNote: isReleased ? 'Released customer-safe report view.' : 'Reviewer draft remains hidden until release.',
      metrics: Array.isArray(payload.metrics) ? payload.metrics : Array.isArray(payload.summaries) ? payload.summaries : [],
    };
  });
}

app.use('*', requireCustomer);

app.get('/export.csv', async (c) => {
  const payload = c.get('customerPayload');
  await requireActiveCustomer(c.env.DB, payload.accountId);
  const items = await fetchWorkspaceResults(c.env.DB, payload.accountId);
  const rows = [
    ['assessment_title', 'participant_name', 'participant_email', 'test_type', 'submitted_at', 'review_status', 'distribution_policy', 'participant_access', 'hr_access', 'score_total', 'score_band', 'profile_code', 'released_summary', 'visibility_note'],
    ...items.map((item) => [item.assessmentTitle, item.participantName, item.participantEmail, item.testType, item.submittedAt, item.reviewStatus, item.distributionPolicy, item.participantResultAccess, item.hrResultAccess, item.scoreTotal, item.scoreBand, item.profileCode, item.releasedSummary, item.visibilityNote]),
  ].map((row) => row.map((value) => escapeCsvValue(value as string | number | null)).join(',')).join('\n');

  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  await recordWorkspaceUsageEvent(c.env.DB, {
    customerAccountId: payload.accountId,
    workspaceSubscriptionId: subscription.id,
    metricKey: 'result_exported',
    referenceType: 'customer_workspace_results',
    referenceId: null,
    metadata: { exportedCount: items.length, format: 'csv' },
  });

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="workspace-results.csv"');
  return c.body(rows);
});

app.get('/:id', async (c) => {
  const payload = c.get('customerPayload');
  await requireActiveCustomer(c.env.DB, payload.accountId);
  const resultId = Number(c.req.param('id'));
  const items = await fetchWorkspaceResults(c.env.DB, payload.accountId);
  const detail = items.find((item) => item.resultId === resultId);
  if (!detail) throw new HTTPException(404, { message: 'Workspace result not found' });
  return c.json(detail);
});

app.get('/', async (c) => {
  const payload = c.get('customerPayload');
  await requireActiveCustomer(c.env.DB, payload.accountId);
  const items = await fetchWorkspaceResults(c.env.DB, payload.accountId);
  return c.json({
    summary: {
      total: items.length,
      released: items.filter((item) => item.reviewStatus === 'released').length,
      awaitingReview: items.filter((item) => item.reviewStatus === 'reviewed' || item.reviewStatus === 'in_review').length,
      hiddenDrafts: items.filter((item) => item.reviewStatus !== 'released').length,
    },
    items: items.map(({ metrics, ...item }) => item),
  });
});

app.get('/:id/pdf', async (c) => {
  const payload = c.get('customerPayload');
  await requireActiveCustomer(c.env.DB, payload.accountId);
  const resultId = Number(c.req.param('id'));
  
  const items = await fetchWorkspaceResults(c.env.DB, payload.accountId);
  const detail = items.find((item) => item.resultId === resultId);
  
  if (!detail) {
    throw new HTTPException(404, { message: 'Workspace result not found' });
  }

  if (detail.reviewStatus !== 'released') {
    return c.json({ 
      error: 'Result not released',
      message: 'PDF export is only available for released results.',
    }, 403);
  }

  return c.json({
    method: 'browser_print',
    printUrl: `/workspace/results/${resultId}/export`,
    message: 'PDF generation via external service not yet configured. Use browser print instead.',
  });
});

export default app;
