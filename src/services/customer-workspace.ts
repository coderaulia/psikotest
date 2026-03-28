import type {
  CreateCustomerWorkspaceMemberPayload,
  CustomerWorkspaceMemberItem,
  CustomerWorkspaceSettingsResponse,
  SendCustomerWorkspaceMemberInviteResponse,
  UpdateCustomerWorkspaceSettingsPayload,
  CustomerWorkspaceTeamResponse,
} from '@/types/assessment';

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

export async function getCustomerWorkspaceTeam() {
  return customerFetchJson<CustomerWorkspaceTeamResponse>('/site-workspace/team');
}

export async function createCustomerWorkspaceMember(payload: CreateCustomerWorkspaceMemberPayload) {
  return customerFetchJson<CustomerWorkspaceMemberItem>('/site-workspace/team', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendCustomerWorkspaceMemberInvite(memberId: number) {
  return customerFetchJson<SendCustomerWorkspaceMemberInviteResponse>(`/site-workspace/team/${memberId}/send`, {
    method: 'POST',
  });
}
