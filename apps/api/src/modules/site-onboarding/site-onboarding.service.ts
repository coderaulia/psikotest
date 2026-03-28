import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findCustomerById, updateCustomerOrganizationName } from '../site-auth/site-auth.repository.js';
import type { AdministrationMode, AssessmentPurpose, InterpretationMode, TestSessionSettings } from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import { parseCustomerWorkspaceSettings, renderWorkspaceTemplate } from '../site-workspace/workspace-settings.js';
import {
  activateCustomerAssessmentRecord,
  fetchCustomerAssessmentById,
  fetchCustomerAssessmentBySessionId,
  fetchCustomerAssessments,
  insertCustomerAssessment,
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
}) {
  const account = await findCustomerById(input.customerAccountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  const normalizedOrganizationName = input.organizationName.trim();

  if (normalizedOrganizationName !== account.organization_name) {
    await updateCustomerOrganizationName(account.id, normalizedOrganizationName);
  }

  const workspaceSettings = parseCustomerWorkspaceSettings(account.settings_json, {
    organizationName: normalizedOrganizationName,
    fullName: account.full_name,
    email: account.email,
    accountType: account.account_type,
  });

  const interpretationMode: InterpretationMode = input.resultVisibility === 'review_required' ? 'professional_review' : 'self_assessment';

  const settings: TestSessionSettings = {
    assessmentPurpose: input.purpose,
    administrationMode: input.administrationMode,
    interpretationMode,
    participantLimit: input.participantLimit ?? workspaceSettings.defaultParticipantLimit,
    consentStatement: renderWorkspaceTemplate(workspaceSettings.defaultConsentStatement, {
      organizationName: normalizedOrganizationName,
      brandName: workspaceSettings.brandName,
      contactPerson: workspaceSettings.contactPerson,
      supportEmail: workspaceSettings.supportEmail,
    }),
    privacyStatement: renderWorkspaceTemplate(workspaceSettings.defaultPrivacyStatement, {
      organizationName: normalizedOrganizationName,
      brandName: workspaceSettings.brandName,
      contactPerson: workspaceSettings.contactPerson,
      supportEmail: workspaceSettings.supportEmail,
    }),
    contactPerson: workspaceSettings.contactPerson,
    distributionPolicy: input.resultVisibility === 'review_required' ? 'full_report_with_consent' : 'participant_summary',
    protectedDeliveryMode: false,
    participantResultAccess: input.resultVisibility === 'review_required' ? 'full_released' : 'summary',
    hrResultAccess: 'full',
  };

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
    },
  });

  const assessment = await fetchCustomerAssessmentBySessionId(input.customerAccountId, created.sessionId);

  if (!assessment) {
    throw new HttpError(500, 'Assessment was created but could not be loaded');
  }

  return assessment;
}

export async function activateCustomerAssessment(customerAccountId: number, assessmentId: number) {
  const account = await findCustomerById(customerAccountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  const assessment = await activateCustomerAssessmentRecord(customerAccountId, assessmentId);

  if (!assessment) {
    throw new HttpError(404, 'Assessment draft not found');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'customer_assessment',
    entityId: assessmentId,
    action: 'customer_assessment.activated',
    metadata: {
      customerAccountId,
      sessionId: assessment.sessionId,
      participantLink: assessment.participantLink,
      sessionStatus: assessment.sessionStatus,
    },
  });

  return assessment;
}


