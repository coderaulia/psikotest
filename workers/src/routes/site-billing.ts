import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  ensureWorkspaceSubscription,
  fetchWorkspaceUsage,
  getManualPlanPrice,
  getPlanCatalog,
  mapCustomerUser,
  requireActiveCustomer,
  requireWorkspaceRole,
  type WorkspaceBillingCycle,
  type WorkspacePlanCode,
  type WorkspaceSubscriptionRow,
} from '../lib/customer-workspace';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();
const plans = getPlanCatalog();
const planOrder: WorkspacePlanCode[] = ['starter', 'growth', 'research'];
const MANUAL_PAYMENT_TTL_SECONDS = 24 * 60 * 60;

const MANUAL_PAYMENT_CONFIG = {
  bankName: 'BCA',
  bankAccountNumber: '1234567890',
  bankAccountHolder: 'PT CODER AULIA DIGITAL',
  instructionsText: 'Transfer sesuai nominal unik lalu kirim bukti pembayaran.',
  currency: 'IDR',
} as const;

const selectionSchema = z.object({
  selectedPlan: z.enum(['starter', 'growth', 'research']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

const submitProofSchema = z
  .object({
    proofUrl: z.string().url().optional(),
    senderName: z.string().trim().max(120).optional(),
    senderBank: z.string().trim().max(120).optional(),
    note: z.string().trim().max(500).optional(),
    transferAt: z.coerce.number().int().optional(),
  })
  .refine((payload) => Boolean(payload.proofUrl || payload.note || payload.senderName || payload.senderBank), {
    message: 'Provide at least one proof field',
  });

type ManualPaymentRow = {
  id: number;
  workspace_id: number;
  customer_id: number | null;
  selected_plan: WorkspacePlanCode;
  billing_cycle: WorkspaceBillingCycle;
  currency: string;
  base_amount: number;
  unique_code: number;
  total_amount: number;
  payment_reference: string;
  payment_method: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  instructions_text: string | null;
  proof_url: string | null;
  proof_filename: string | null;
  sender_name: string | null;
  sender_bank: string | null;
  transfer_note: string | null;
  transfer_at: number | null;
  proof_submitted_at: number | null;
  status: 'pending' | 'paid' | 'rejected' | 'expired';
  expires_at: number | null;
  verified_at: number | null;
  verified_by_admin_id: number | null;
  rejection_reason: string | null;
  created_at: number;
  updated_at: number;
};

function toUnixNow() {
  return Math.floor(Date.now() / 1000);
}

function toIsoFromUnix(value: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

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

function getSuggestedPlan(
  resourceLimitKey: 'assessmentLimit' | 'participantLimit' | 'teamMemberLimit',
  currentValue: number,
  currentPlan: WorkspacePlanCode,
) {
  for (const planCode of planOrder) {
    if (plans[planCode][resourceLimitKey] > currentValue && planOrder.indexOf(planCode) > planOrder.indexOf(currentPlan)) {
      return planCode;
    }
  }
  return getNextPlan(currentPlan);
}

function buildDiagnostic(
  label: string,
  resource: 'assessments' | 'participants' | 'team_members',
  current: number,
  limit: number,
  currentPlan: WorkspacePlanCode,
) {
  const severity = buildUsageSeverity(current, limit);
  const suggestedPlanCode =
    severity === 'healthy'
      ? null
      : getSuggestedPlan(
          resource === 'assessments' ? 'assessmentLimit' : resource === 'participants' ? 'participantLimit' : 'teamMemberLimit',
          current,
          currentPlan,
        );
  const suggestedPlanLabel = suggestedPlanCode ? plans[suggestedPlanCode].label : null;
  const remaining = Math.max(limit - current, 0);

  let message = `${label} is within the current workspace plan.`;
  if (severity === 'warning') message = `${label} is approaching the current plan limit.`;
  if (severity === 'critical') message = `${label} is nearly full. Upgrade before the next operational step.`;
  if (severity === 'limit_reached') {
    message = suggestedPlanLabel
      ? `${label} has reached the current plan limit. Upgrade to ${suggestedPlanLabel} to continue.`
      : `${label} has reached the highest bundled plan limit.`;
  }

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

function inferPaymentStatus(row: Pick<ManualPaymentRow, 'status' | 'expires_at'>, now = toUnixNow()): ManualPaymentRow['status'] {
  if (row.status === 'pending' && row.expires_at != null && row.expires_at < now) return 'expired';
  return row.status;
}

function mapManualPayment(row: ManualPaymentRow, now = toUnixNow()) {
  const effectiveStatus = inferPaymentStatus(row, now);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    customerId: row.customer_id,
    selectedPlan: row.selected_plan,
    billingCycle: row.billing_cycle,
    currency: row.currency,
    baseAmount: row.base_amount,
    uniqueCode: row.unique_code,
    totalAmount: row.total_amount,
    paymentReference: row.payment_reference,
    paymentMethod: row.payment_method,
    bankName: row.bank_name,
    bankAccountNumber: row.bank_account_number,
    bankAccountHolder: row.bank_account_holder,
    instructionsText: row.instructions_text,
    proofUrl: row.proof_url,
    proofFilename: row.proof_filename,
    senderName: row.sender_name,
    senderBank: row.sender_bank,
    note: row.transfer_note,
    transferAt: row.transfer_at,
    proofSubmittedAt: row.proof_submitted_at,
    status: effectiveStatus,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at,
    verifiedByAdminId: row.verified_by_admin_id,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function markExpiredIfNeeded(db: D1Database, payment: ManualPaymentRow, now = toUnixNow()) {
  if (payment.status === 'pending' && payment.expires_at != null && payment.expires_at < now) {
    await run(db, `UPDATE manual_payments SET status = 'expired', updated_at = ? WHERE id = ?`, [now, payment.id]);
    return { ...payment, status: 'expired' as const, updated_at: now };
  }
  return payment;
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

async function fetchManualPayments(db: D1Database, workspaceId: number, limit = 20) {
  const result = await query(
    db,
    `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
            base_amount, unique_code, total_amount, payment_reference, payment_method,
            bank_name, bank_account_number, bank_account_holder, instructions_text,
            proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
            proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
            rejection_reason, created_at, updated_at
     FROM manual_payments
     WHERE workspace_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [workspaceId, limit],
  );

  const now = toUnixNow();
  return (result.results ?? []).map((row) => mapManualPayment(row as unknown as ManualPaymentRow, now));
}

function generatePaymentReference() {
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${datePart}-${randomPart}`;
}

async function createManualPayment(db: D1Database, input: {
  workspaceId: number;
  customerId: number;
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}) {
  const now = toUnixNow();
  const existingPending = await queryOne<ManualPaymentRow>(
    db,
    `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
            base_amount, unique_code, total_amount, payment_reference, payment_method,
            bank_name, bank_account_number, bank_account_holder, instructions_text,
            proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
            proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
            rejection_reason, created_at, updated_at
     FROM manual_payments
     WHERE workspace_id = ? AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1`,
    [input.workspaceId],
  );

  if (existingPending) {
    const normalized = await markExpiredIfNeeded(db, existingPending, now);
    if (normalized.status === 'pending') {
      return { payment: mapManualPayment(normalized, now), reused: true as const };
    }
  }

  const baseAmount = getManualPlanPrice(input.selectedPlan, input.billingCycle, MANUAL_PAYMENT_CONFIG.currency);
  const uniqueCode = Math.floor(100 + Math.random() * 900);
  const totalAmount = baseAmount + uniqueCode;
  const expiresAt = now + MANUAL_PAYMENT_TTL_SECONDS;

  let paymentReference = generatePaymentReference();
  for (let i = 0; i < 3; i += 1) {
    const existingReference = await queryOne<{ id: number }>(
      db,
      'SELECT id FROM manual_payments WHERE payment_reference = ? LIMIT 1',
      [paymentReference],
    );
    if (!existingReference) break;
    paymentReference = generatePaymentReference();
  }

  const insert = await run(
    db,
    `INSERT INTO manual_payments (
       workspace_id, customer_id, selected_plan, billing_cycle, currency, base_amount,
       unique_code, total_amount, payment_reference, payment_method, bank_name,
       bank_account_number, bank_account_holder, instructions_text, status, expires_at,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'bank_transfer', ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      input.workspaceId,
      input.customerId,
      input.selectedPlan,
      input.billingCycle,
      MANUAL_PAYMENT_CONFIG.currency,
      baseAmount,
      uniqueCode,
      totalAmount,
      paymentReference,
      MANUAL_PAYMENT_CONFIG.bankName,
      MANUAL_PAYMENT_CONFIG.bankAccountNumber,
      MANUAL_PAYMENT_CONFIG.bankAccountHolder,
      MANUAL_PAYMENT_CONFIG.instructionsText,
      expiresAt,
      now,
      now,
    ],
  );

  const created = await queryOne<ManualPaymentRow>(
    db,
    `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
            base_amount, unique_code, total_amount, payment_reference, payment_method,
            bank_name, bank_account_number, bank_account_holder, instructions_text,
            proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
            proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
            rejection_reason, created_at, updated_at
     FROM manual_payments
     WHERE id = ?
     LIMIT 1`,
    [Number(insert.meta.last_row_id)],
  );

  if (!created) {
    throw new Error('Manual payment could not be created');
  }

  return { payment: mapManualPayment(created, now), reused: false as const };
}

async function buildOverview(db: D1Database, payload: CustomerJwtPayload) {
  const account = await requireActiveCustomer(db, payload.accountId);
  const subscription = await ensureWorkspaceSubscription(db, account);
  const usage = await fetchWorkspaceUsage(db, payload.accountId);
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
      monthlyPrice: getManualPlanPrice(planCode, 'monthly', 'IDR'),
      annualPrice: getManualPlanPrice(planCode, 'annual', 'IDR'),
    })),
    recentInvoices: await fetchInvoices(db, payload.accountId, 10),
    recentManualPayments: await fetchManualPayments(db, payload.accountId, 10),
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

app.post('/manual-payment', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Only workspace owner/admin can create manual payment');
  try {
    const body = selectionSchema.parse(await c.req.json());
    const account = await requireActiveCustomer(c.env.DB, payload.accountId);
    await ensureWorkspaceSubscription(c.env.DB, account);
    const created = await createManualPayment(c.env.DB, {
      workspaceId: payload.accountId,
      customerId: payload.accountId,
      selectedPlan: body.selectedPlan,
      billingCycle: body.billingCycle,
    });

    return c.json(
      {
        payment: created.payment,
        reused: created.reused,
      },
      created.reused ? 200 : 201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid payload' }, 400);
    }
    console.error('[site-billing/manual-payment] creation error', error);
    return c.json({ error: 'Failed to create manual payment' }, 500);
  }
});

app.get('/manual-payments', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace billing is limited to owners and workspace admins');
  const account = await requireActiveCustomer(c.env.DB, payload.accountId);
  await ensureWorkspaceSubscription(c.env.DB, account);
  const payments = await fetchManualPayments(c.env.DB, payload.accountId, 20);
  return c.json({ payments });
});

app.post('/manual-payments/:id/proof', async (c) => {
  const payload = requireWorkspaceRole(c, ['owner', 'admin'], 'Workspace billing is limited to owners and workspace admins');
  const paymentId = Number(c.req.param('id'));
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    return c.json({ error: 'Invalid payment id' }, 400);
  }

  try {
    const body = submitProofSchema.parse(await c.req.json());
    const now = toUnixNow();
    const existing = await queryOne<ManualPaymentRow>(
      c.env.DB,
      `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
              base_amount, unique_code, total_amount, payment_reference, payment_method,
              bank_name, bank_account_number, bank_account_holder, instructions_text,
              proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
              proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
              rejection_reason, created_at, updated_at
       FROM manual_payments
       WHERE id = ? AND workspace_id = ?
       LIMIT 1`,
      [paymentId, payload.accountId],
    );

    if (!existing) return c.json({ error: 'Payment not found' }, 404);

    const normalized = await markExpiredIfNeeded(c.env.DB, existing, now);
    if (normalized.status !== 'pending') {
      return c.json({ error: `Payment cannot accept proof in status ${normalized.status}` }, 409);
    }

    await run(
      c.env.DB,
      `UPDATE manual_payments
       SET proof_url = COALESCE(?, proof_url),
           sender_name = COALESCE(?, sender_name),
           sender_bank = COALESCE(?, sender_bank),
           transfer_note = COALESCE(?, transfer_note),
           transfer_at = COALESCE(?, transfer_at),
           proof_submitted_at = ?,
           updated_at = ?
       WHERE id = ? AND workspace_id = ?`,
      [body.proofUrl ?? null, body.senderName ?? null, body.senderBank ?? null, body.note ?? null, body.transferAt ?? null, now, now, paymentId, payload.accountId],
    );

    const updated = await queryOne<ManualPaymentRow>(
      c.env.DB,
      `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
              base_amount, unique_code, total_amount, payment_reference, payment_method,
              bank_name, bank_account_number, bank_account_holder, instructions_text,
              proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
              proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
              rejection_reason, created_at, updated_at
       FROM manual_payments
       WHERE id = ?
       LIMIT 1`,
      [paymentId],
    );

    if (!updated) return c.json({ error: 'Payment not found after update' }, 404);
    return c.json({ payment: mapManualPayment(updated, now) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid payload' }, 400);
    }
    console.error('[site-billing/manual-payments/proof] submission error', error);
    return c.json({ error: 'Failed to submit payment proof' }, 500);
  }
});

app.post('/checkout-session', async () => {
  return new Response(JSON.stringify({ error: 'Checkout session is disabled. Use manual payment flow.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
});

app.patch('/subscription', async () => {
  return new Response(JSON.stringify({ error: 'Subscription update requires admin payment verification.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
});

export default app;
