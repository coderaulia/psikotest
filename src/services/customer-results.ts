import type { CustomerWorkspaceResultsResponse } from '@/types/assessment';

import { customerFetch, customerFetchJson } from './customer-api';

export async function getCustomerWorkspaceResults() {
  return customerFetchJson<CustomerWorkspaceResultsResponse>('/site-results');
}

export async function downloadCustomerWorkspaceResultsCsv() {
  const response = await customerFetch('/site-results/export.csv');
  const csv = await response.text();

  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return csv;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'workspace-results.csv';
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  return csv;
}
