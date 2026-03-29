import type { CustomerWorkspaceResultsResponse } from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function getCustomerWorkspaceResults() {
  return customerFetchJson<CustomerWorkspaceResultsResponse>('/site-results');
}
