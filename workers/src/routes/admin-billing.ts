import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  addBillingCycle,
  ensureWorkspaceSubscription,
  getPlanCatalog,
  requireActiveCustomer,
  type WorkspaceBillingCycle,
  type WorkspacePlanCode,
} from '../lib/customer-workspace';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();
const plans = getPlanCatalog();

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

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(250),
});

function toUnixNow() {
  return Math.floor(Date.now() / 1000);
}

function toIsoNow() {
  return new Date().toISOString();
}

function toIsoFromUnix(value: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function normalizeStatus(payment: ManualPaymentRow, now = toUnixNow()) {
  if (payment.status === 'pending' && payment.expires_at != null && payment.expires_at < now) {
    return 'expired' as const;
  }
  return payment.status;
}

function mapManualPayment(payment: ManualPaymentRow, now = toUnixNow()) {
  return {
    id: payment.id,
    workspaceId: payment.workspace_id,
    customerId: payment.customer_id,
    selectedPlan: payment.selected_plan,
    billingCycle: payment.billing_cycle,
    currency: payment.currency,
    baseAmount: payment.base_amount,
    uniqueCode: payment.unique_code,
    totalAmount: payment.total_amount,
    paymentReference: payment.payment_reference,
    paymentMethod: payment.payment_method,
    bankName: payment.bank_name,
    bankAccountNumber: payment.bank_account_number,
    bankAccountHolder: payment.bank_account_holder,
    instructionsText: payment.instructions_text,
    proofUrl: payment.proof_url,
    proofFilename: payment.proof_filename,
    senderName: payment.sender_name,
    senderBank: payment.sender_bank,
    note: payment.transfer_note,
    transferAt: payment.transfer_at,
    proofSubmittedAt: payment.proof_submitted_at,
    status: normalizeStatus(payment, now),
    expiresAt: payment.expires_at,
    verifiedAt: payment.verified_at,
    verifiedByAdminId: payment.verified_by_admin_id,
    rejectionReason: payment.rejection_reason,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}

function assertBillingAdmin(c: { get: (key: string) => unknown; json: (body: unknown, status: number) => Response }) {
  const payload = c.get('adminPayload') as AdminJwtPayload;
  if (payload.role === 'psychologist_reviewer') {
    return c.json({ error: 'Admin billing access required' }, 403);
  }
  return null;
}

async function loadPaymentById(db: D1Database, paymentId: number) {
  return queryOne<ManualPaymentRow>(
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
    [paymentId],
  );
}

async function markExpiredIfNeeded(db: D1Database, payment: ManualPaymentRow, now = toUnixNow()) {
  if (payment.status === 'pending' && payment.expires_at != null && payment.expires_at < now) {
    await run(db, `UPDATE manual_payments SET status = 'expired', updated_at = ? WHERE id = ?`, [now, payment.id]);
    return { ...payment, status: 'expired' as const, updated_at: now };
  }
  return payment;
}

app.use('*', requireAdmin);

app.get('/manual-payments', async (c) => {
  const roleError = assertBillingAdmin(c);
  if (roleError) return roleError;

  const status = c.req.query('status');
  const now = toUnixNow();
  const params: unknown[] = [];
  let where = '';
  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  const rows = await query(
    c.env.DB,
    `SELECT id, workspace_id, customer_id, selected_plan, billing_cycle, currency,
            base_amount, unique_code, total_amount, payment_reference, payment_method,
            bank_name, bank_account_number, bank_account_holder, instructions_text,
            proof_url, proof_filename, sender_name, sender_bank, transfer_note, transfer_at,
            proof_submitted_at, status, expires_at, verified_at, verified_by_admin_id,
            rejection_reason, created_at, updated_at
     FROM manual_payments
     ${where}
     ORDER BY created_at DESC
     LIMIT 100`,
    params,
  );

  const payments = (rows.results ?? []).map((row) => mapManualPayment(row as unknown as ManualPaymentRow, now));
  return c.json({ payments });
});

app.get('/manual-payments/:id', async (c) => {
  const roleError = assertBillingAdmin(c);
  if (roleError) return roleError;

  const paymentId = Number(c.req.param('id'));
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    return c.json({ error: 'Invalid payment id' }, 400);
  }

  const payment = await loadPaymentById(c.env.DB, paymentId);
  if (!payment) return c.json({ error: 'Payment not found' }, 404);
  return c.json({ payment: mapManualPayment(payment) });
});

app.post('/manual-payments/:id/approve', async (c) => {
  const roleError = assertBillingAdmin(c);
  if (roleError) return roleError;

  const payload = c.get('adminPayload');
  const paymentId = Number(c.req.param('id'));
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    return c.json({ error: 'Invalid payment id' }, 400);
  }

  try {
    const now = toUnixNow();
    const existing = await loadPaymentById(c.env.DB, paymentId);
    if (!existing) return c.json({ error: 'Payment not found' }, 404);
    const payment = await markExpiredIfNeeded(c.env.DB, existing, now);
    if (payment.status !== 'pending') {
      return c.json({ error: `Payment already ${payment.status}` }, 409);
    }

    const account = await requireActiveCustomer(c.env.DB, payment.workspace_id);
    const subscription = await ensureWorkspaceSubscription(c.env.DB, account);
    const plan = plans[payment.selected_plan];
    const periodStart = toIsoNow();
    const periodEnd = addBillingCycle(payment.billing_cycle);

    await run(
      c.env.DB,
      `UPDATE workspace_subscriptions
       SET plan_code = ?, status = 'active', billing_cycle = ?, billing_provider = 'manual',
           assessment_limit = ?, participant_limit = ?, team_member_limit = ?,
           trial_ends_at = NULL, renews_at = ?, current_period_start = ?, current_period_end = ?,
           cancel_at_period_end = 0, canceled_at = NULL, past_due_at = NULL, suspended_at = NULL,
           plan_version = plan_version + 1, billing_contact_email = COALESCE(billing_contact_email, ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND customer_account_id = ?`,
      [
        payment.selected_plan,
        payment.billing_cycle,
        plan.assessmentLimit,
        plan.participantLimit,
        plan.teamMemberLimit,
        periodEnd,
        periodStart,
        periodEnd,
        account.email,
        subscription.id,
        payment.workspace_id,
      ],
    );

    const verifiedAtUnix = toUnixNow();
    await run(
      c.env.DB,
      `UPDATE manual_payments
       SET status = 'paid',
           verified_at = ?,
           verified_by_admin_id = ?,
           rejection_reason = NULL,
           updated_at = ?
       WHERE id = ?`,
      [verifiedAtUnix, payload.adminId, verifiedAtUnix, payment.id],
    );

    await run(
      c.env.DB,
      `INSERT INTO billing_invoices (
         customer_account_id, workspace_subscription_id, checkout_session_id, external_invoice_id,
         invoice_number, status, currency_code, amount_subtotal, amount_total, hosted_invoice_url,
         invoice_pdf_url, issued_at, due_at, paid_at, metadata_json, created_at, updated_at
       ) VALUES (?, ?, NULL, NULL, ?, 'paid', ?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        payment.workspace_id,
        subscription.id,
        `INV-MANUAL-${payment.id}`,
        payment.currency,
        payment.base_amount,
        payment.total_amount,
        JSON.stringify({
          source: 'manual_payment',
          manualPaymentId: payment.id,
          paymentReference: payment.payment_reference,
          verifiedByAdminId: payload.adminId,
        }),
      ],
    );

    const updated = await loadPaymentById(c.env.DB, paymentId);
    return c.json({ payment: updated ? mapManualPayment(updated) : null });
  } catch (error) {
    console.error('[admin-billing/approve] payment approval error', error);
    return c.json({ error: 'Failed to approve payment' }, 500);
  }
});

app.post('/manual-payments/:id/reject', async (c) => {
  const roleError = assertBillingAdmin(c);
  if (roleError) return roleError;

  const payload = c.get('adminPayload');
  const paymentId = Number(c.req.param('id'));
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    return c.json({ error: 'Invalid payment id' }, 400);
  }

  try {
    const body = rejectSchema.parse(await c.req.json());
    const now = toUnixNow();
    const existing = await loadPaymentById(c.env.DB, paymentId);
    if (!existing) return c.json({ error: 'Payment not found' }, 404);
    const payment = await markExpiredIfNeeded(c.env.DB, existing, now);
    if (payment.status !== 'pending') {
      return c.json({ error: `Payment already ${payment.status}` }, 409);
    }

    await run(
      c.env.DB,
      `UPDATE manual_payments
       SET status = 'rejected',
           rejection_reason = ?,
           verified_by_admin_id = ?,
           verified_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [body.reason, payload.adminId, now, now, payment.id],
    );

    const updated = await loadPaymentById(c.env.DB, paymentId);
    return c.json({ payment: updated ? mapManualPayment(updated) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message ?? 'Invalid payload' }, 400);
    }
    console.error('[admin-billing/reject] payment rejection error', error);
    return c.json({ error: 'Failed to reject payment' }, 500);
  }
});

app.post('/manual-payments/:id/expire', async (c) => {
  const roleError = assertBillingAdmin(c);
  if (roleError) return roleError;

  const paymentId = Number(c.req.param('id'));
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    return c.json({ error: 'Invalid payment id' }, 400);
  }

  const payment = await loadPaymentById(c.env.DB, paymentId);
  if (!payment) return c.json({ error: 'Payment not found' }, 404);
  if (payment.status !== 'pending') return c.json({ error: `Payment already ${payment.status}` }, 409);

  const now = toUnixNow();
  await run(c.env.DB, `UPDATE manual_payments SET status = 'expired', updated_at = ? WHERE id = ?`, [now, paymentId]);
  const updated = await loadPaymentById(c.env.DB, paymentId);
  return c.json({ payment: updated ? mapManualPayment(updated) : null });
});

export default app;
