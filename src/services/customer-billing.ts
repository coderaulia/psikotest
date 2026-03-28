import type { CustomerBillingOverviewResponse, UpdateWorkspaceSubscriptionPayload } from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function getCustomerBillingOverview() {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/overview');
}

export async function updateCustomerSubscription(payload: UpdateWorkspaceSubscriptionPayload) {
  return customerFetchJson<CustomerBillingOverviewResponse>('/site-billing/subscription', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
