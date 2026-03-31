import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  addBillingCycle,
  ensureWorkspaceSubscription,
  fetchWorkspaceUsage,
  getPlanCatalog,
  getPlanPrice,
  mapCustomerUser,
  recordWorkspaceUsageEvent,
  requireActiveCustomer,
  requireWorkspaceRole,
  syncWorkspaceUsageSnapshot,
  type WorkspaceBillingCycle,
  type WorkspacePlanCode,
  type WorkspaceSubscriptionRow,
} from '../lib/customer-workspace';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();
const plans = getPlanCatalog();
const planOrder: WorkspacePlanCode[] = ['starter', 'growth', 'research'];

const selectionSchema = z.object({
  selectedPlan: z.enum(['starter', 'growth', 'research']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

function buildUsageSeverity(current: number, limit: number) {
  if (current >= limit) return 'limit_reached' as const;
  const ratio = current / Math.max(limit, 1);
  const remaining = limit - current;
  if (remaining <= 1 || ratio >= 0.9) return 'critical' as const;
  if (ratio >= 0.7) return 'warning' as const;
  return 'healthy' as const;
}

function getNextPlan(currentPlan: WorkspacePlanCode) {
  const index = planOrder.indexOf(currentPlan);
  return index >= 0 && index < planOrder.length - 1 ? planOrder[index + 1] : null;
}

function getSuggestedPlan(resourceLimitKey: 'assessmentLimit' | 'participantLimit' | 'teamMemberLimit', currentValue: number, currentPlan: WorkspacePlanCode) {
  for (const planCode of planOrder) {
    if (plans[planCode][resourceLimitKey] > currentValue && planOrder.indexOf(planCode) > planOrder.indexOf(currentPlan)) {
      return planCode;
    }
  }
  return getNextPlan(currentPlan);
}

function buildDiagnostic(label: string, resource: 'assessments' | 'participants' | 'team_members', current: number, limit: number, currentPlan: WorkspacePlanCode) {
  const severity = buildUsageSeverity(current, limit);
  const suggestedPlanCode = severity === 'healthy'
    ? null
    : getSuggestedPlan(resource === 'assessments' ? 'assessmentLimit' : resource === 'participants' ? 'participantLimit' : 'teamMemberLimit', current, currentPlan);
  const suggestedPlanLabel = suggestedPlanCode ? plans[suggestedPlanCode].label : null;
  const remaining = Math.max(limit - current, 0);

  let message = `${label} is within the current workspace plan.`;
  if (severity === 'warning') message = `${label} is approaching the current plan limit.`;
  if (severity === 'critical') message = `${label} is nearly full. Upgrade before the next operational step.`;
  if (severity === 'limit_reached') message = suggestedPlanLabel ? `${label} has reached the current plan limit. Upgrade to ${suggestedPlanLabel} to continue.` : `${label} has reached the highest bundled plan limit.`;

  return {
    resource,
    label,
    current,
    limit,
    remaining,
    utilizationPercent: Math.min(100, Math.round((current / Math.max(limit, 1)) * 100)),
    severity,
    suggestedPlanCode,
    suggestedPlanLabel,
    message,
  };
}

async function fetchInvoices(db: D1Database, accountId: number, limit = 20) {
  const result = await query(
    db,
    `SELECT id, customer_account_id, workspace_subscription_id, checkout_session_id,
            external_invoice_id, invoice_number, status, currency_code,
            amount_subtotal, amount_total, hosted_invoice_url, invoice_pdf_url,
            issued_at, due_at, paid_at, metadata_json, created_at
     FROM billing_invoices
     WHERE customer_account_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [accountId, limit],
  );

  return (result.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: Number(item.id),
      customerAccountId: Number(item.customer_account_id),
      workspaceSubscriptionId: Number(item.workspace_subscription_id),
      checkoutSessionId: item.checkout_session_id ? Number(item.checkout_session_id) : null,
      externalInvoiceId: item.external_invoice_id ?? null,
      invoiceNumber: item.invoice_number ?? null,
      status: item.status,
      currencyCode: item.currency_code,
      amountSubtotal: Number(item.amount_subtotal ?? 0),
      amountTotal: Number(item.amount_total ?? 0),
      hostedInvoiceUrl: item.hosted_invoice_url ?? null,
      invoicePdfUrl: item.invoice_pdf_url ?? null,
      issuedAt: item.issued_at ?? null,
      dueAt: item.due_at ?? null,
      paidAt: item.paid_at ?? null,
      metadata: item.metadata_json ? JSON.parse(String(item.metadata_json)) : {},
      createdAt: item.created_at,
    };
  });
}

async function fetchCheckoutSessions(db: D1Database, accountId: number, limit = 10) {
  const result = await query(
    db,
    `SELECT id, customer_account_id, workspace_subscription_id, session_key,
            billing_provider, plan_code, billing_cycle, status,
            checkout_url, expires_at, completed_at, metadata_json, created_at
     FROM billing_checkout_sessions
     WHERE customer_account_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [accountId, limit],
  );

  return (result.results ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: Number(item.id),
      customerAccountId: Number(item.customer_account_id),
      workspaceSubscriptionId: Number(item.workspace_subscription_id),
      sessionKey: item.session_key,
      billingProvider: item.billing_provider,
      planCode: item.plan_code,
      billingCycle: item.billing_cycle,
      status: item.status,
      checkoutUrl: item.checkout_url ?? null,
      expiresAt: item.expires_at ?? null,
      completedAt: item.completed_at ?? null,
      metadata: item.metadata_json ? JSON.parse(String(item.metadata_json)) : {},
      createdAt: item.created_at,
    };
  });
}

async function createCheckoutSession(db: D1Database, input: {
  accountId: number;
  subscriptionId: number;
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
  status: 'open' | 'completed';
  metadata: Record<string, unknown>;
}) {
  const sessionKey = crypto.randomUUID();
  const checkoutUrl = input.status === 'open' ? `https://billing.vanaila.local/checkout/${sessionKey}` : null;
  const expiresAt = input.status === 'open' ? addBillingCycle('monthly') : null;
  const completedAt = input.status === 'completed' ? new Date().toISOString() : null;

  const insert = await run(
    db,
    `INSERT INTO billing_checkout_sessions (
       customer_account_id, workspace_subscription_id, session_key, billing_provider,
       plan_code, billing_cycle, status, checkout_url, expires_at, completed_at,
       metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, 'dummy', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [input.accountId, input.subscriptionId, sessionKey, input.selectedPlan, input.billingCycle, input.status, checkoutUrl, expiresAt, completedAt, JSON.stringify(input.metadata)],
  );

  const created = await queryOne<Record<string, unknown>>(
    db,
    `SELECT id, customer_account_id, workspace_subscription_id, session_key,
            billing_provider, plan_code, billing_cycle, status,
            checkout_url, expires_at, completed_at, metadata_json, created_at
     FROM billing_checkout_sessions
     WHERE id = ? LIMIT 1`,
    [Number(insert.meta.last_row_id)],
  );

  if (!created) {
    throw new HTTPException(500, { message: 'Billing checkout session could not be created' });
  }

  return {
    id: Number(created.id),
    customerAccountId: Number(created.customer_account_id),
    workspaceSubscriptionId: Number(created.workspace_subscription_id),
    sessionKey: created.session_key,
    billingProvider: created.billing_provider,
    planCode: created.plan_code,
    billingCycle: created.billing_cycle,
    status: created.status,
    checkoutUrl: created.checkout_url ?? null,
    expiresAt: created.expires_at ?? null,
    completedAt: created.completed_at ?? null,
    metadata: created.metadata_json ? JSON.parse(String(created.metadata_json)) : {},
    createdAt: created.created_at,
  };
}

async function createInvoice(db: D1Database, input: {
  accountId: number;
  subscriptionId: number;
  checkoutSessionId: number | null;
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}) {
  await run(
    db,
    `INSERT INTO billing_invoices (
       customer_account_id, workspace_subscription_id, checkout_session_id, external_invoice_id,
       invoice_number, status, currency_code, amount_subtotal, amount_total,
       hosted_invoice_url, invoice_pdf_url, issued_at, due_at, paid_at, metadata_json,
       created_at, updated_at
     ) VALUES (?, ?, ?, NULL, ?, 'paid', 'USD', ?, ?, NULL, NULL, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      input.accountId,
      input.subscriptionId,
      input.checkoutSessionId,
      `INV-${input.subscriptionId}-${Date.now()}`,
      getPlanPrice(input.selectedPlan, input.billingCycle),
      getPlanPrice(input.selectedPlan, input.billingCycle),
      JSON.stringify({ mode: 'dummy', planCode: input.selectedPlan, billingCycle: input.billingCycle }),
    ],
  );
}

async function buildOverview(db: D1Database, payload: CustomerJwtPayload) {
  const account = await requireActiveCustomer(db, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(db, account);
  const usage = await syncWorkspaceUsageSnapshot(db, payload.accountId, subscription);
  const diagnostics = [
    buildDiagnostic('Assessment capacity', 'assessments', usage.activeAssessmentCount, subscription.assessment_limit, subscription.plan_code),
    buildDiagnostic('Participant records', 'participants', usage.participantRecordCount, subscription.participant_limit, subscription.plan_code),
    buildDiagnostic('Team seats', 'team_members', usage.teamSeatCount, subscription.team_member_limit, subscription.plan_code),
  ];
  const flagged = diagnostics.filter((item) => item.severity !== 'healthy');
  const highestSeverity = flagged[0]?.severity ?? 'healthy';
  const suggestedPlanCode = flagged.reduce<WorkspacePlanCode | null>((selected, item) => {
    if (!item.suggestedPlanCode) return selected;
    if (!selected) return item.suggestedPlanCode;
    return planOrder.indexOf(item.suggestedPlanCode) > planOrder.indexOf(selected) ? item.suggestedPlanCode : selected;
  }, null);

  return {
    account: mapCustomerUser(account, payload),
    subscription: {
      id: subscription.id,
      customerAccountId: subscription.customer_account_id,
      planCode: subscription.plan_code,
      status: subscription.status,
      billingCycle: subscription.billing_cycle,
      billingProvider: subscription.billing_provider,
      providerCustomerId: subscription.provider_customer_id,
      providerSubscriptionId: subscription.provider_subscription_id,
      providerPriceId: subscription.provider_price_id,
      assessmentLimit: subscription.assessment_limit,
      participantLimit: subscription.participant_limit,
      teamMemberLimit: subscription.team_member_limit,
      startedAt: subscription.started_at,
      trialEndsAt: subscription.trial_ends_at,
      renewsAt: subscription.renews_at,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      canceledAt: subscription.canceled_at,
      pastDueAt: subscription.past_due_at,
      suspendedAt: subscription.suspended_at,
      planVersion: subscription.plan_version,
      billingContactEmail: subscription.billing_contact_email,
      planLabel: plans[subscription.plan_code].label,
      planDescription: plans[subscription.plan_code].description,
    },
    usage: {
      activeAssessmentCount: usage.activeAssessmentCount,
      participantRecordCount: usage.participantRecordCount,
      teamSeatCount: usage.teamSeatCount,
      remainingAssessmentSlots: Math.max(subscription.assessment_limit - usage.activeAssessmentCount, 0),
      remainingParticipantSlots: Math.max(subscription.participant_limit - usage.participantRecordCount, 0),
      remainingTeamSeats: Math.max(subscription.team_member_limit - usage.teamSeatCount, 0),
    },
    diagnostics,
    upgradeGuidance: {
      isUpgradeRecommended: flagged.length > 0,
      highestSeverity,
      suggestedPlanCode,
      suggestedPlanLabel: suggestedPlanCode ? plans[suggestedPlanCode].label : null,
      reasons: flagged.map((item) => item.message),
      isCurrentPlanSaturated: flagged.some((item) => item.severity === 'limit_reached'),
      currentPlanCode: subscription.plan_code,
    },
    plans: (Object.entries(plans) as Array<[WorkspacePlanCode, (typeof plans)[WorkspacePlanCode]]>).map(([planCode, plan]) => ({
      planCode,
      label: plan.label,
      description: plan.description,
      assessmentLimit: plan.assessmentLimit,
      participantLimit: plan.participantLimit,
      teamMemberLimit: plan.teamMemberLimit,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
    })),
    recentCheckoutSessions: await fetchCheckoutSessions(db, payload.accountId, 5),
    recentInvoices: await fetchInvoices(db, payload.accountId, 10),
  };
}

app.use('*', requireCustomer);

app.get('/overview', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace billing is limited to owners and workspace admins');
  return c.json(await buildOverview(c.env.DB, payload));
});

app.get('/invoices', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace billing is limited to owners and workspace admins');
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  await ensureWorkspaceSubscription(c.env.DB, account);
  return c.json({
    account: mapCustomerUser(account, payload),
    invoices: await fetchInvoices(c.env.DB, payload.accountId, 20),
  });
});

app.post('/checkout-session', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner'], 'Only the workspace owner can start checkout');
  const body = selectionSchema.parse(await c.req.json());
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
  const checkoutSession = await createCheckoutSession(c.env.DB, {
    accountId: payload.accountId,
    subscriptionId: subscription.id,
    selectedPlan: body.selectedPlan,
    billingCycle: body.billingCycle,
    status: 'open',
    metadata: {
      mode: 'dummy',
      currentPlanCode: subscription.plan_code,
      nextPlanCode: body.selectedPlan,
    },
  });

  return c.json({
    checkoutSession,
    overview: await buildOverview(c.env.DB, payload),
  }, 201);
});

app.patch('/subscription', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner'], 'Only the workspace owner can change the subscription');
  const body = selectionSchema.parse(await c.req.json());
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  const currentSubscription = await ensureWorkspaceSubscription(c.env.DB, account);
  const plan = plans[body.selectedPlan];
  const now = new Date().toISOString();
  const currentPeriodEnd = addBillingCycle(body.billingCycle);

  await run(
    c.env.DB,
    `UPDATE workspace_subscriptions
     SET plan_code = ?, status = 'active', billing_cycle = ?, billing_provider = 'dummy',
         assessment_limit = ?, participant_limit = ?, team_member_limit = ?,
         trial_ends_at = NULL, renews_at = ?, current_period_start = ?, current_period_end = ?,
         cancel_at_period_end = 0, canceled_at = NULL, past_due_at = NULL, suspended_at = NULL,
         plan_version = plan_version + 1, billing_contact_email = COALESCE(billing_contact_email, ?), updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND customer_account_id = ?`,
    [body.selectedPlan, body.billingCycle, plan.assessmentLimit, plan.participantLimit, plan.teamMemberLimit, currentPeriodEnd, now, currentPeriodEnd, account.email, currentSubscription.id, payload.accountId],
  );

  const updated = await ensureWorkspaceSubscription(c.env.DB, account);
  const checkoutSession = await createCheckoutSession(c.env.DB, {
    accountId: payload.accountId,
    subscriptionId: updated.id,
    selectedPlan: body.selectedPlan,
    billingCycle: body.billingCycle,
    status: 'completed',
    metadata: {
      mode: 'dummy',
      previousPlanCode: currentSubscription.plan_code,
      nextPlanCode: body.selectedPlan,
    },
  });

  await createInvoice(c.env.DB, {
    accountId: payload.accountId,
    subscriptionId: updated.id,
    checkoutSessionId: checkoutSession.id,
    selectedPlan: body.selectedPlan,
    billingCycle: body.billingCycle,
  });

  await recordWorkspaceUsageEvent(c.env.DB, {
    customerAccountId: payload.accountId,
    workspaceSubscriptionId: updated.id,
    metricKey: 'assessment_created',
    quantity: 0,
    referenceType: 'workspace_subscription',
    referenceId: updated.id,
    metadata: {
      category: 'billing',
      action: 'workspace_subscription.updated',
      previousPlanCode: currentSubscription.plan_code,
      nextPlanCode: body.selectedPlan,
      billingCycle: body.billingCycle,
    },
  });

  await run(
    c.env.DB,
    `INSERT INTO audit_events (
       actor_type, actor_customer_id, entity_type, entity_id, action, metadata_json, created_at
     ) VALUES ('system', ?, 'workspace_subscription', ?, 'workspace_subscription.updated', ?, CURRENT_TIMESTAMP)`,
    [payload.accountId, updated.id, JSON.stringify({ previousPlanCode: currentSubscription.plan_code, nextPlanCode: body.selectedPlan, billingCycle: body.billingCycle, dummyMode: true })],
  );

  return c.json(await buildOverview(c.env.DB, payload));
});

export default app;
