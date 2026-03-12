import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findCustomerById, updateCustomerOrganizationName } from '../site-auth/site-auth.repository.js';
import {
  getDefaultResearchSessionSettings,
  getDefaultTestSessionSettings,
  type AdministrationMode,
  type AssessmentPurpose,
  type InterpretationMode,
} from '../test-sessions/session-settings.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
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

function buildConsentStatement(input: {
  organizationName: string;
  purpose: AssessmentPurpose;
  testType: PublicTestTypeCode;
}) {
  if (input.purpose === 'research' || input.testType === 'custom') {
    return `I agree to participate in this research assessment conducted by ${input.organizationName.trim()} and understand that my responses will be collected for structured analysis.`;
  }

  return `I agree to participate in this psychological assessment for ${input.organizationName.trim()} and understand that my responses will be used for the stated assessment purpose.`;
}

function buildPrivacyStatement(input: {
  organizationName: string;
  purpose: AssessmentPurpose;
  testType: PublicTestTypeCode;
}) {
  if (input.purpose === 'research' || input.testType === 'custom') {
    return `Your responses will be stored as confidential research data for ${input.organizationName.trim()} and accessed only by authorized academic or project reviewers.`;
  }

  return `Your personal information and responses will be treated as confidential assessment data for ${input.organizationName.trim()} and accessed only by authorized reviewers.`;
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

  const interpretationMode: InterpretationMode = input.resultVisibility === 'review_required' ? 'professional_review' : 'self_assessment';
  const defaults = input.purpose === 'research' || input.testType === 'custom'
    ? getDefaultResearchSessionSettings()
    : getDefaultTestSessionSettings();

  const settings = {
    assessmentPurpose: input.purpose,
    administrationMode: input.administrationMode,
    interpretationMode,
    participantLimit: input.participantLimit,
    consentStatement: buildConsentStatement({
      organizationName: normalizedOrganizationName,
      purpose: input.purpose,
      testType: input.testType,
    }),
    privacyStatement: buildPrivacyStatement({
      organizationName: normalizedOrganizationName,
      purpose: input.purpose,
      testType: input.testType,
    }),
    contactPerson: account.full_name || defaults.contactPerson,
  };

  const created = await insertCustomerAssessment({
    customerAccountId: input.customerAccountId,
    organizationName: normalizedOrganizationName,
    testType: input.testType,
    title: input.title,
    description: buildDescription(normalizedOrganizationName, input.purpose, input.testType),
    instructions: getParticipantInstructions(input.testType, input.purpose),
    timeLimitMinutes: input.timeLimitMinutes ?? getDefaultTimeLimit(input.testType),
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
      participantLimit: input.participantLimit,
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
