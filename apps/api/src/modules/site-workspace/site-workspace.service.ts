import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findActiveCustomerById } from '../site-auth/site-auth.repository.js';
import { updateCustomerWorkspaceRecord } from './site-workspace.repository.js';
import { parseCustomerWorkspaceSettings } from './workspace-settings.js';

function mapAccount(record: {
  id: number;
  full_name: string;
  email: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
}) {
  return {
    id: record.id,
    fullName: record.full_name,
    email: record.email,
    accountType: record.account_type,
    organizationName: record.organization_name,
  };
}

function getWorkspaceContext(record: {
  full_name: string;
  email: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
}) {
  return {
    fullName: record.full_name,
    email: record.email,
    accountType: record.account_type,
    organizationName: record.organization_name,
  };
}

export async function getCustomerWorkspaceSettings(accountId: number) {
  const account = await findActiveCustomerById(accountId);

  if (!account) {
    throw new HttpError(401, 'Customer session is no longer active');
  }

  return {
    account: mapAccount(account),
    settings: parseCustomerWorkspaceSettings(account.settings_json, getWorkspaceContext(account)),
  };
}

export async function updateCustomerWorkspaceSettings(
  accountId: number,
  input: {
    organizationName: string;
    brandName: string;
    brandTagline: string;
    supportEmail: string;
    contactPerson: string;
    defaultAssessmentPurpose: 'recruitment' | 'employee_development' | 'academic_evaluation' | 'research' | 'self_assessment';
    defaultAdministrationMode: 'supervised' | 'remote_unsupervised';
    defaultResultVisibility: 'participant_summary' | 'review_required';
    defaultParticipantLimit: number | null;
    defaultTimeLimitMinutes: number | null;
    defaultConsentStatement: string;
    defaultPrivacyStatement: string;
  },
) {
  const account = await findActiveCustomerById(accountId);

  if (!account) {
    throw new HttpError(401, 'Customer session is no longer active');
  }

  const nextOrganizationName = input.organizationName.trim();
  const nextSettings = {
    brandName: input.brandName.trim(),
    brandTagline: input.brandTagline.trim(),
    supportEmail: input.supportEmail.trim().toLowerCase(),
    contactPerson: input.contactPerson.trim(),
    defaultAssessmentPurpose: input.defaultAssessmentPurpose,
    defaultAdministrationMode: input.defaultAdministrationMode,
    defaultResultVisibility: input.defaultResultVisibility,
    defaultParticipantLimit: input.defaultParticipantLimit,
    defaultTimeLimitMinutes: input.defaultTimeLimitMinutes,
    defaultConsentStatement: input.defaultConsentStatement.trim(),
    defaultPrivacyStatement: input.defaultPrivacyStatement.trim(),
  };

  await updateCustomerWorkspaceRecord({
    customerAccountId: accountId,
    organizationName: nextOrganizationName,
    settingsJson: JSON.stringify(nextSettings),
  });

  const refreshed = await findActiveCustomerById(accountId);

  if (!refreshed) {
    throw new HttpError(500, 'Workspace settings were updated but could not be reloaded');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_workspace',
    entityId: refreshed.id,
    action: 'customer_workspace.settings_updated',
    metadata: {
      customerAccountId: refreshed.id,
      organizationName: refreshed.organization_name,
      defaultAssessmentPurpose: nextSettings.defaultAssessmentPurpose,
      defaultAdministrationMode: nextSettings.defaultAdministrationMode,
      defaultResultVisibility: nextSettings.defaultResultVisibility,
      defaultParticipantLimit: nextSettings.defaultParticipantLimit,
      defaultTimeLimitMinutes: nextSettings.defaultTimeLimitMinutes,
    },
  });

  return {
    account: mapAccount(refreshed),
    settings: parseCustomerWorkspaceSettings(nextSettings, getWorkspaceContext(refreshed)),
  };
}
