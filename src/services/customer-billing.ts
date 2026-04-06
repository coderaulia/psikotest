import type {
  CreateManualPaymentPayload,
  CreateManualPaymentResponse,
  CustomerBillingInvoicesResponse,
  CustomerBillingOverviewResponse,
  CustomerManualPaymentsResponse,
  SubmitManualPaymentProofPayload,
} from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function getCustomerBillingOverview() {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/overview');
}

export async function getCustomerBillingInvoices() {
  return customerFetchJson<CustomerBillingInvoicesResponse>('/site-billing/invoices');
}

export async function createCustomerManualPayment(payload: CreateManualPaymentPayload) {
  return customerFetchJson<CreateManualPaymentResponse>('/site-billing/manual-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCustomerManualPayments() {
  return customerFetchJson<CustomerManualPaymentsResponse>('/site-billing/manual-payments');
}

export async function submitCustomerManualPaymentProof(paymentId: number, payload: SubmitManualPaymentProofPayload) {
  return customerFetchJson<{ payment: CreateManualPaymentResponse['payment'] }>(`/site-billing/manual-payments/${paymentId}/proof`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Backward compatibility for old callers.
export async function createCustomerCheckoutSession(payload: CreateManualPaymentPayload) {
  return createCustomerManualPayment(payload);
}

// Manual verification required now; endpoint returns 403.
export async function updateCustomerSubscription() {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/subscription', {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}
