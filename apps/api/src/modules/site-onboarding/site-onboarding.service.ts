import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findCustomerById, updateCustomerOrganizationName } from '../site-auth/site-auth.repository.js';
import type { AdministrationMode, AssessmentPurpose, InterpretationMode, TestSessionSettings } from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import { parseCustomerWorkspaceSettings, renderWorkspaceTemplate } from '../site-workspace/workspace-settings.js';
import {
  assertAssessmentCreationCapacity,
  assertParticipantCapacity,
  updateWorkspaceSubscriptionSelection,
  type DummyCheckoutBillingCycle,
  type DummyCheckoutPlan,
} from '../site-billing/site-billing.service.js';
import {
  activateCustomerAssessmentRecord,
  fetchCustomerAssessmentById,
  fetchCustomerAssessmentBySessionId,
  fetchCustomerAssessmentParticipants,
  fetchCustomerAssessments,
  insertCustomerAssessment,
  markCustomerAssessmentParticipantInvited,
  type CustomerAssessmentInviteChannel,
  type CustomerAssessmentParticipantListResponse,
  upsertCustomerAssessmentParticipant,
  updateCustomerAssessmentRecord,
} from './site-onboarding.repository.js';

export type CustomerAssessmentResultVisibility = 'participant_summary' | 'review_required';

function getDefaultTimeLimit(testType: PublicTestTypeCode) {
  if (testType === 'iq') {
    return 20;
  }

  if (testType === 'disc') {
    return 15;
  }

  if (testType === 'workload') {
    return 12;
  }

  return 15;
}

function getParticipantInstructions(testType: PublicTestTypeCode, purpose: AssessmentPurpose) {
  if (testType === 'iq') {
    return [
      'Read each multiple-choice question carefully before choosing one answer.',
      'Work steadily and avoid leaving the session before you submit.',
      purpose === 'research'
        ? 'This session is configured for structured data collection rather than clinical interpretation.'
        : 'The result is indicative and should be reviewed in the context of the stated assessment purpose.',
    ].join('\n');
  }

  if (testType === 'disc') {
    return [
      'Choose the statements that are most and least like you in your current context.',
      'Answer honestly rather than selecting what seems ideal.',
      'Profile output is indicative and may require professional review for formal decisions.',
    ].join('\n');
  }

  if (testType === 'workload') {
    return [
      'Respond based on your recent work experience and current workload perception.',
      'Use the full scale when it reflects your experience.',
      'The summary is intended for structured workload monitoring and follow-up discussion.',
    ].join('\n');
  }

  return [
    'Read each statement carefully before responding.',
    'Use the full response scale to reflect your current experience.',
    'This custom assessment is configured for structured psychological research and questionnaire data collection.',
  ].join('\n');
}

function buildDescription(organizationName: string, purpose: AssessmentPurpose, testType: PublicTestTypeCode) {
  const purposeLabel = purpose.replace(/_/g, ' ');
  return `Draft ${testType.toUpperCase()} assessment for ${organizationName.trim()} (${purposeLabel}).`;
}

function resolveInterpretationMode(resultVisibility: CustomerAssessmentResultVisibility): InterpretationMode {
  return resultVisibility === 'review_required' ? 'professional_review' : 'self_assessment';
}

function buildAssessmentSettings(input: {
  workspaceDefaults: ReturnType<typeof parseCustomerWorkspaceSettings>;
  organizationName: string;
  purpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  participantLimit: number | null;
  resultVisibility: CustomerAssessmentResultVisibility;
  protectedDeliveryMode: boolean;
}) {
  return {
    assessmentPurpose: input.purpose,
    administrationMode: input.administrationMode,
    interpretationMode: resolveInterpretationMode(input.resultVisibility),
    participantLimit: input.participantLimit ?? input.workspaceDefaults.defaultParticipantLimit,
    consentStatement: renderWorkspaceTemplate(input.workspaceDefaults.defaultConsentStatement, {
      organizationName: input.organizationName,
      brandName: input.workspaceDefaults.brandName,
      contactPerson: input.workspaceDefaults.contactPerson,
      supportEmail: input.workspaceDefaults.supportEmail,
    }),
    privacyStatement: renderWorkspaceTemplate(input.workspaceDefaults.defaultPrivacyStatement, {
      organizationName: input.organizationName,
      brandName: input.workspaceDefaults.brandName,
      contactPerson: input.workspaceDefaults.contactPerson,
      supportEmail: input.workspaceDefaults.supportEmail,
    }),
    contactPerson: input.workspaceDefaults.contactPerson,
    distributionPolicy: input.resultVisibility === 'review_required' ? 'full_report_with_consent' : 'participant_summary',
    protectedDeliveryMode: input.protectedDeliveryMode,
    participantResultAccess: input.resultVisibility === 'review_required' ? 'full_released' : 'summary',
    hrResultAccess: 'full',
  } satisfies TestSessionSettings;
}

async function requireActiveCustomer(customerAccountId: number) {
  const account = await findCustomerById(customerAccountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  return account;
}

async function normalizeOrganization(accountId: number, currentOrganizationName: string, nextOrganizationName: string) {
  if (nextOrganizationName !== currentOrganizationName) {
    await updateCustomerOrganizationName(accountId, nextOrganizationName);
  }
}

export async function listCustomerAssessmentItems(customerAccountId: number) {
  return fetchCustomerAssessments(customerAccountId);
}

export async function getCustomerAssessmentDetail(customerAccountId: number, assessmentId: number) {
  return fetchCustomerAssessmentById(customerAccountId, assessmentId);
}

export async function createCustomerAssessment(input: {
  customerAccountId: number;
  testType: PublicTestTypeCode;
  title: string;
  organizationName: string;
  purpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  participantLimit: number | null;
  timeLimitMinutes: number | null;
  resultVisibility: CustomerAssessmentResultVisibility;
  protectedDeliveryMode: boolean;
}) {
  const account = await requireActiveCustomer(input.customerAccountId);
  await assertAssessmentCreationCapacity(input.customerAccountId);
  const normalizedOrganizationName = input.organizationName.trim();

  await normalizeOrganization(account.id, account.organization_name, normalizedOrganizationName);

  const workspaceSettings = parseCustomerWorkspaceSettings(account.settings_json, {
    organizationName: normalizedOrganizationName,
    fullName: account.full_name,
    email: account.email,
    accountType: account.account_type,
  });

  const settings = buildAssessmentSettings({
    workspaceDefaults: workspaceSettings,
    organizationName: normalizedOrganizationName,
    purpose: input.purpose,
    administrationMode: input.administrationMode,
    participantLimit: input.participantLimit,
    resultVisibility: input.resultVisibility,
    protectedDeliveryMode: input.protectedDeliveryMode,
  });

  const created = await insertCustomerAssessment({
    customerAccountId: input.customerAccountId,
    organizationName: normalizedOrganizationName,
    testType: input.testType,
    title: input.title,
    description: buildDescription(normalizedOrganizationName, input.purpose, input.testType),
    instructions: getParticipantInstructions(input.testType, input.purpose),
    timeLimitMinutes: input.timeLimitMinutes ?? workspaceSettings.defaultTimeLimitMinutes ?? getDefaultTimeLimit(input.testType),
    settings,
  });

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment',
    entityId: created.assessmentId,
    action: 'customer_assessment.created',
    metadata: {
      customerAccountId: input.customerAccountId,
      sessionId: created.sessionId,
      testType: input.testType,
      purpose: input.purpose,
      administrationMode: input.administrationMode,
      resultVisibility: input.resultVisibility,
      participantLimit: input.participantLimit ?? workspaceSettings.defaultParticipantLimit,
      timeLimitMinutes: input.timeLimitMinutes ?? workspaceSettings.defaultTimeLimitMinutes ?? getDefaultTimeLimit(input.testType),
      supportEmail: workspaceSettings.supportEmail,
      brandName: workspaceSettings.brandName,
      protectedDeliveryMode: input.protectedDeliveryMode,
    },
  });

  const assessment = await fetchCustomerAssessmentBySessionId(input.customerAccountId, created.sessionId);

  if (!assessment) {
    throw new HttpError(500, 'Assessment was created but could not be loaded');
  }

  return assessment;
}

export async function updateCustomerAssessment(input: {
  customerAccountId: number;
  assessmentId: number;
  testType: PublicTestTypeCode;
  title: string;
  organizationName: string;
  purpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  participantLimit: number | null;
  timeLimitMinutes: number | null;
  resultVisibility: CustomerAssessmentResultVisibility;
  protectedDeliveryMode: boolean;
}) {
  const account = await requireActiveCustomer(input.customerAccountId);
  const normalizedOrganizationName = input.organizationName.trim();

  await normalizeOrganization(account.id, account.organization_name, normalizedOrganizationName);

  const workspaceSettings = parseCustomerWorkspaceSettings(account.settings_json, {
    organizationName: normalizedOrganizationName,
    fullName: account.full_name,
    email: account.email,
    accountType: account.account_type,
  });

  let updated: Awaited<ReturnType<typeof updateCustomerAssessmentRecord>>;

  try {
    updated = await updateCustomerAssessmentRecord({
      customerAccountId: input.customerAccountId,
      assessmentId: input.assessmentId,
      organizationName: normalizedOrganizationName,
      testType: input.testType,
      title: input.title,
      description: buildDescription(normalizedOrganizationName, input.purpose, input.testType),
      instructions: getParticipantInstructions(input.testType, input.purpose),
      timeLimitMinutes: input.timeLimitMinutes ?? workspaceSettings.defaultTimeLimitMinutes ?? getDefaultTimeLimit(input.testType),
      settings: buildAssessmentSettings({
        workspaceDefaults: workspaceSettings,
        organizationName: normalizedOrganizationName,
        purpose: input.purpose,
        administrationMode: input.administrationMode,
        participantLimit: input.participantLimit,
        resultVisibility: input.resultVisibility,
        protectedDeliveryMode: input.protectedDeliveryMode,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Only draft assessments can be edited') {
      throw new HttpError(409, error.message);
    }

    throw error;
  }

  if (!updated) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment',
    entityId: updated.assessmentId,
    action: 'customer_assessment.updated',
    metadata: {
      customerAccountId: input.customerAccountId,
      sessionId: updated.sessionId,
      testType: input.testType,
      purpose: input.purpose,
      administrationMode: input.administrationMode,
      resultVisibility: input.resultVisibility,
      participantLimit: updated.participantLimit,
      timeLimitMinutes: updated.timeLimitMinutes,
      protectedDeliveryMode: input.protectedDeliveryMode,
    },
  });

  return updated;
}

export async function completeCustomerAssessmentCheckout(input: {
  customerAccountId: number;
  assessmentId: number;
  plan: DummyCheckoutPlan;
  billingCycle: DummyCheckoutBillingCycle;
}) {
  await updateWorkspaceSubscriptionSelection({
    customerAccountId: input.customerAccountId,
    planCode: input.plan,
    billingCycle: input.billingCycle,
  });
  const assessment = await activateCustomerAssessmentRecord(input.customerAccountId, input.assessmentId);

  if (!assessment) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment',
    entityId: input.assessmentId,
    action: 'customer_assessment.checkout_completed',
    metadata: {
      customerAccountId: input.customerAccountId,
      sessionId: assessment.sessionId,
      plan: input.plan,
      billingCycle: input.billingCycle,
      sessionStatus: assessment.sessionStatus,
      participantLink: assessment.participantLink,
      dummyMode: true,
    },
  });

  return assessment;
}

export async function activateCustomerAssessment(customerAccountId: number, assessmentId: number) {
  return completeCustomerAssessmentCheckout({
    customerAccountId,
    assessmentId,
    plan: 'starter',
    billingCycle: 'monthly',
  });
}

export async function listCustomerAssessmentParticipants(customerAccountId: number, assessmentId: number) {
  const list = await fetchCustomerAssessmentParticipants(customerAccountId, assessmentId);

  if (!list) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  return list;
}

export async function addCustomerAssessmentParticipant(input: {
  customerAccountId: number;
  assessmentId: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
}) {
  await requireActiveCustomer(input.customerAccountId);
  const existingList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);

  if (!existingList) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const alreadyExists = existingList.items.some((item) => item.email.toLowerCase() === normalizedEmail);

  if (!alreadyExists) {
    await assertParticipantCapacity(input.customerAccountId);
  }

  const participant = await upsertCustomerAssessmentParticipant(input);

  if (!participant) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment_participant',
    entityId: participant.id,
    action: 'customer_assessment_participant.upserted',
    metadata: {
      customerAccountId: input.customerAccountId,
      assessmentId: input.assessmentId,
      email: participant.email,
      status: participant.status,
    },
  });

  return participant;
}

export async function sendCustomerAssessmentBulkInvites(input: {
  customerAccountId: number;
  assessmentId: number;
  channel: CustomerAssessmentInviteChannel;
}) {
  await requireActiveCustomer(input.customerAccountId);
  const participantList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);

  if (!participantList) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  const targets = participantList.items.filter((item) => item.status !== 'completed');

  if (targets.length === 0) {
    return {
      invitedCount: 0,
      skippedCount: participantList.items.length,
      shareLink: participantList.shareLink,
      deliveryPreview: 'No pending participants require a reminder right now.',
    };
  }

  let invitedCount = 0;
  for (const participant of targets) {
    const invited = await markCustomerAssessmentParticipantInvited({
      customerAccountId: input.customerAccountId,
      assessmentId: input.assessmentId,
      participantRecordId: participant.id,
      channel: input.channel,
    });

    if (invited) {
      invitedCount += 1;
    }
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment_participant',
    entityId: input.assessmentId,
    action: 'customer_assessment_participant.bulk_invited',
    metadata: {
      customerAccountId: input.customerAccountId,
      assessmentId: input.assessmentId,
      channel: input.channel,
      invitedCount,
      skippedCount: participantList.items.length - invitedCount,
      shareLink: participantList.shareLink,
      dummyMode: true,
    },
  });

  return {
    invitedCount,
    skippedCount: participantList.items.length - invitedCount,
    shareLink: participantList.shareLink,
    deliveryPreview:
      input.channel === 'email'
        ? `Dummy email invites queued for ${invitedCount} participant(s). Share link: ${participantList.shareLink}`
        : `Share this link with ${invitedCount} participant(s): ${participantList.shareLink}`,
  };
}

export async function sendCustomerAssessmentParticipantInvite(input: {
  customerAccountId: number;
  assessmentId: number;
  participantRecordId: number;
  channel: CustomerAssessmentInviteChannel;
}) {
  await requireActiveCustomer(input.customerAccountId);
  const participant = await markCustomerAssessmentParticipantInvited(input);
  const participantList = await fetchCustomerAssessmentParticipants(input.customerAccountId, input.assessmentId);

  if (!participant || !participantList) {
    throw new HttpError(404, 'Participant invite record not found');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment_participant',
    entityId: participant.id,
    action: 'customer_assessment_participant.invited',
    metadata: {
      customerAccountId: input.customerAccountId,
      assessmentId: input.assessmentId,
      channel: input.channel,
      shareLink: participantList.shareLink,
      email: participant.email,
      dummyMode: true,
    },
  });

  return {
    participant,
    shareLink: participantList.shareLink,
    deliveryPreview:
      input.channel === 'email'
        ? `Dummy email queued for ${participant.email}. Share link: ${participantList.shareLink}`
        : `Share this link with ${participant.fullName}: ${participantList.shareLink}`,
  };
}
