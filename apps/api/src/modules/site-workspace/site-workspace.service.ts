import { randomBytes } from 'node:crypto';

import { env } from '../../config/env.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { assertTeamMemberCapacity } from '../site-billing/site-billing.service.js';
import { findActiveCustomerById } from '../site-auth/site-auth.repository.js';
import {
  fetchCustomerWorkspaceActivity,
  fetchCustomerWorkspaceMembers,
  findCustomerWorkspaceMemberById,
  issueCustomerWorkspaceMemberInvite,
  markCustomerWorkspaceMemberNotified,
  updateCustomerWorkspaceRecord,
  upsertCustomerWorkspaceMember,
} from './site-workspace.repository.js';
import { parseCustomerWorkspaceSettings } from './workspace-settings.js';

const INVITE_TTL_IN_HOURS = 72;

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
    workspaceRole: 'owner' as const,
    sessionSource: 'owner' as const,
    workspaceMemberId: null,
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

async function requireActiveCustomer(accountId: number) {
  const account = await findActiveCustomerById(accountId);

  if (!account) {
    throw new HttpError(401, 'Customer session is no longer active');
  }

  return account;
}

function buildOwnerMember(account: {
  id: number;
  full_name: string;
  email: string;
}) {
  return {
    id: account.id,
    fullName: account.full_name,
    email: account.email,
    role: 'owner' as const,
    status: 'active' as const,
    source: 'owner' as const,
    invitedAt: null,
    lastNotifiedAt: null,
    activatedAt: null,
    activationExpiresAt: null,
    lastLoginAt: null,
  };
}

function buildActivationLink(token: string) {
  return `${env.APP_ORIGIN.replace(/\/$/, '')}/accept-workspace-invite/${token}`;
}

function buildLoginLink() {
  return `${env.APP_ORIGIN.replace(/\/$/, '')}/login`;
}

export async function getCustomerWorkspaceSettings(accountId: number) {
  const account = await requireActiveCustomer(accountId);

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
  const account = await requireActiveCustomer(accountId);

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

  const refreshed = await requireActiveCustomer(accountId);

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

export async function listCustomerWorkspaceMembers(accountId: number) {
  const account = await requireActiveCustomer(accountId);
  const members = await fetchCustomerWorkspaceMembers(accountId);

  return {
    workspace: {
      organizationName: account.organization_name,
      ownerName: account.full_name,
      ownerEmail: account.email,
      accountType: account.account_type,
    },
    items: [buildOwnerMember(account), ...members],
  };
}

export async function addCustomerWorkspaceMember(input: {
  accountId: number;
  fullName: string;
  email: string;
  role: 'admin' | 'operator' | 'reviewer';
}) {
  const account = await requireActiveCustomer(input.accountId);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (normalizedEmail === account.email.toLowerCase()) {
    throw new HttpError(409, 'The workspace owner is already part of this team');
  }

  const existingMembers = await fetchCustomerWorkspaceMembers(input.accountId);
  const memberAlreadyExists = existingMembers.some((member) => member.email.toLowerCase() === normalizedEmail);

  if (!memberAlreadyExists) {
    await assertTeamMemberCapacity(input.accountId);
  }

  const member = await upsertCustomerWorkspaceMember({
    customerAccountId: input.accountId,
    fullName: input.fullName,
    email: normalizedEmail,
    role: input.role,
  });

  if (!member) {
    throw new HttpError(500, 'Workspace member could not be saved');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_workspace_member',
    entityId: member.id,
    action: 'customer_workspace.member_upserted',
    metadata: {
      customerAccountId: input.accountId,
      email: member.email,
      role: member.role,
      status: member.status,
    },
  });

  return member;
}

export async function sendCustomerWorkspaceMemberInvite(input: {
  accountId: number;
  memberId: number;
}) {
  const account = await requireActiveCustomer(input.accountId);
  const existingMember = await findCustomerWorkspaceMemberById({
    customerAccountId: input.accountId,
    memberId: input.memberId,
  });

  if (!existingMember) {
    throw new HttpError(404, 'Workspace member not found');
  }

  if (existingMember.status === 'active') {
    const member = await markCustomerWorkspaceMemberNotified({
      customerAccountId: input.accountId,
      memberId: input.memberId,
    });

    if (!member) {
      throw new HttpError(404, 'Workspace member not found');
    }

    await createAuditEvent({
      actorType: 'system',
      entityType: 'customer_workspace_member',
      entityId: member.id,
      action: 'customer_workspace.member_login_reminder_sent',
      metadata: {
        customerAccountId: input.accountId,
        email: member.email,
        role: member.role,
      },
    });

    return {
      member,
      activationLink: null,
      loginLink: buildLoginLink(),
      expiresAt: null,
      deliveryPreview: `Login reminder prepared for ${member.email}. They can sign in at ${buildLoginLink()}.`,
    };
  }

  const activationToken = randomBytes(24).toString('hex');
  const activationExpiresAt = new Date(Date.now() + INVITE_TTL_IN_HOURS * 60 * 60 * 1000).toISOString();
  const member = await issueCustomerWorkspaceMemberInvite({
    customerAccountId: input.accountId,
    memberId: input.memberId,
    activationToken,
    activationExpiresAt,
  });

  if (!member) {
    throw new HttpError(404, 'Workspace member not found');
  }

  const activationLink = buildActivationLink(activationToken);

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_workspace_member',
    entityId: member.id,
    action: 'customer_workspace.member_invited',
    metadata: {
      customerAccountId: input.accountId,
      email: member.email,
      role: member.role,
      workspace: account.organization_name,
      activationExpiresAt,
    },
  });

  return {
    member,
    activationLink,
    loginLink: null,
    expiresAt: activationExpiresAt,
    deliveryPreview: `Activation link prepared for ${member.email}. It expires in ${INVITE_TTL_IN_HOURS} hours.`,
  };
}


function formatActivityLabel(action: string) {
  switch (action) {
    case 'customer_assessment.created':
      return 'Assessment draft created';
    case 'customer_assessment.updated':
      return 'Assessment updated';
    case 'customer_assessment.checkout_completed':
      return 'Plan checkout completed';
    case 'customer_assessment_participant.upserted':
      return 'Participant saved';
    case 'customer_assessment_participant.imported':
      return 'Participant list imported';
    case 'customer_assessment_participant.bulk_invited':
      return 'Bulk invitations prepared';
    case 'customer_assessment_participant.bulk_reminded':
      return 'Bulk reminders prepared';
    case 'customer_assessment_participant.invited':
      return 'Participant invitation prepared';
    case 'customer_assessment_participant.reminded':
      return 'Participant reminder prepared';
    case 'customer_workspace.settings_updated':
      return 'Workspace settings updated';
    case 'customer_workspace.member_upserted':
      return 'Workspace member saved';
    case 'customer_workspace.member_invited':
      return 'Workspace invite prepared';
    case 'customer_workspace.member_login_reminder_sent':
      return 'Workspace login reminder sent';
    case 'customer_workspace.member_activated':
      return 'Workspace member activated';
    case 'workspace_subscription.updated':
      return 'Workspace subscription changed';
    default:
      return action.replace(/[._]/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
  }
}

function formatActivityDescription(action: string, metadata: Record<string, unknown>) {
  switch (action) {
    case 'customer_assessment.created':
      return `${String(metadata.testType ?? 'assessment').toUpperCase()} draft created for ${String(metadata.organizationName ?? 'the workspace')}.`;
    case 'customer_assessment.updated':
      return `${String(metadata.testType ?? 'assessment').toUpperCase()} draft updated with refreshed configuration.`;
    case 'customer_assessment.checkout_completed':
      return `Dummy checkout completed on ${String(metadata.plan ?? 'current')} (${String(metadata.billingCycle ?? 'monthly')}) to unlock sharing.`;
    case 'customer_assessment_participant.imported':
      return `${Number(metadata.importedCount ?? 0)} participant rows imported and ${Number(metadata.updatedCount ?? 0)} updated.`;
    case 'customer_assessment_participant.bulk_invited':
      return `${Number(metadata.invitedCount ?? 0)} invites prepared via ${String(metadata.channel ?? 'email')}.`;
    case 'customer_assessment_participant.bulk_reminded':
      return `${Number(metadata.remindedCount ?? 0)} reminders prepared via ${String(metadata.channel ?? 'email')}.`;
    case 'customer_assessment_participant.invited':
      return `Invitation prepared for ${String(metadata.email ?? 'participant')} via ${String(metadata.channel ?? 'email')}.`;
    case 'customer_assessment_participant.reminded':
      return `Reminder prepared for ${String(metadata.email ?? 'participant')} via ${String(metadata.channel ?? 'email')}.`;
    case 'customer_assessment_participant.upserted':
      return `Participant record saved for ${String(metadata.email ?? 'participant')}.`;
    case 'customer_workspace.settings_updated':
      return 'Consent text, privacy text, and default assessment settings were updated.';
    case 'customer_workspace.member_upserted':
      return `Workspace member ${String(metadata.email ?? '')} was saved as ${String(metadata.role ?? 'member')}.`;
    case 'customer_workspace.member_invited':
      return `Activation link prepared for ${String(metadata.email ?? 'the invited member')}.`;
    case 'customer_workspace.member_login_reminder_sent':
      return `Login reminder prepared for ${String(metadata.email ?? 'the workspace member')}.`;
    case 'customer_workspace.member_activated':
      return `${String(metadata.email ?? 'A workspace member')} activated workspace access.`;
    case 'workspace_subscription.updated':
      return `Plan changed to ${String(metadata.nextPlanCode ?? metadata.planCode ?? 'current')} on ${String(metadata.billingCycle ?? 'monthly')}.`;
    default:
      return 'Workspace activity recorded for audit and operational tracking.';
  }
}

function categorizeActivity(action: string) {
  if (action.startsWith('customer_assessment_participant.')) {
    return 'participant_delivery' as const;
  }

  if (action.startsWith('customer_assessment.')) {
    return 'assessment' as const;
  }

  if (action.startsWith('customer_workspace.member_')) {
    return 'team' as const;
  }

  if (action.startsWith('workspace_subscription.')) {
    return 'billing' as const;
  }

  return 'workspace' as const;
}

export async function getCustomerWorkspaceActivity(accountId: number, limit = 24) {
  const account = await requireActiveCustomer(accountId);
  const items = (await fetchCustomerWorkspaceActivity(accountId, limit)).map((item) => ({
    ...item,
    category: categorizeActivity(item.action),
    label: formatActivityLabel(item.action),
    description: formatActivityDescription(item.action, item.metadata),
  }));

  const summary = items.reduce(
    (accumulator, item) => {
      accumulator.totalEvents += 1;

      if (item.category === 'assessment') {
        accumulator.assessmentEvents += 1;
      } else if (item.category === 'participant_delivery') {
        accumulator.participantDeliveryEvents += 1;
      } else if (item.category === 'team') {
        accumulator.teamEvents += 1;
      } else if (item.category === 'billing') {
        accumulator.billingEvents += 1;
      }

      return accumulator;
    },
    {
      totalEvents: 0,
      assessmentEvents: 0,
      participantDeliveryEvents: 0,
      teamEvents: 0,
      billingEvents: 0,
    },
  );

  return {
    workspace: {
      organizationName: account.organization_name,
      accountType: account.account_type,
    },
    summary,
    items,
  };
}
