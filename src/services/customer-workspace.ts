import type { CustomerWorkspaceSettingsResponse, UpdateCustomerWorkspaceSettingsPayload } from '@/types/assessment';

import { refreshCustomerProfile } from './customer-api';
import { customerFetchJson } from './customer-api';

export async function getCustomerWorkspaceSettings() {
  return customerFetchJson<CustomerWorkspaceSettingsResponse>('/site-workspace/settings');
}

export async function updateCustomerWorkspaceSettings(payload: UpdateCustomerWorkspaceSettingsPayload) {
  const response = await customerFetchJson<CustomerWorkspaceSettingsResponse>('/site-workspace/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  await refreshCustomerProfile();
  return response;
}
