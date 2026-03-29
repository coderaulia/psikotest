import type {
  CreateWorkspaceCheckoutSessionPayload,
  CreateWorkspaceCheckoutSessionResponse,
  CustomerBillingInvoicesResponse,
  CustomerBillingOverviewResponse,
  UpdateWorkspaceSubscriptionPayload,
} from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function getCustomerBillingOverview() {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/overview');
}

export async function getCustomerBillingInvoices() {
  return customerFetchJson<CustomerBillingInvoicesResponse>('/site-billing/invoices');
}

export async function createCustomerCheckoutSession(payload: CreateWorkspaceCheckoutSessionPayload) {
  return customerFetchJson<CreateWorkspaceCheckoutSessionResponse>('/site-billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomerSubscription(payload: UpdateWorkspaceSubscriptionPayload) {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/subscription', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
