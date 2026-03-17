import type { CustomerAssessmentResultVisibility } from '../site-onboarding/site-onboarding.service.js';
import type { AdministrationMode, AssessmentPurpose } from '../test-sessions/session-settings.js';

export interface CustomerWorkspaceContext {
  organizationName: string;
  fullName: string;
  email: string;
  accountType: 'business' | 'researcher';
}

export interface CustomerWorkspaceSettings {
  brandName: string;
  brandTagline: string;
  supportEmail: string;
  contactPerson: string;
  defaultAssessmentPurpose: AssessmentPurpose;
  defaultAdministrationMode: AdministrationMode;
  defaultResultVisibility: CustomerAssessmentResultVisibility;
  defaultParticipantLimit: number | null;
  defaultTimeLimitMinutes: number | null;
  defaultConsentStatement: string;
  defaultPrivacyStatement: string;
}

function getDefaultAssessmentPurpose(accountType: CustomerWorkspaceContext['accountType']): AssessmentPurpose {
  return accountType === 'researcher' ? 'research' : 'recruitment';
}

function getDefaultResultVisibility(accountType: CustomerWorkspaceContext['accountType']): CustomerAssessmentResultVisibility {
  return accountType === 'researcher' ? 'participant_summary' : 'review_required';
}

function getDefaultParticipantLimit(accountType: CustomerWorkspaceContext['accountType']) {
  return accountType === 'researcher' ? 100 : 25;
}

function getDefaultTimeLimit(accountType: CustomerWorkspaceContext['accountType']) {
  return accountType === 'researcher' ? 15 : 20;
}

function getDefaultBrandTagline(accountType: CustomerWorkspaceContext['accountType']) {
  return accountType === 'researcher'
    ? 'Structured psychological research workspace'
    : 'Structured psychological assessment workspace';
}

function getDefaultConsentStatement(accountType: CustomerWorkspaceContext['accountType']) {
  if (accountType === 'researcher') {
    return 'I agree to participate in this assessment or questionnaire managed by {{organizationName}} and understand that my responses will be collected for structured research or academic analysis.';
  }

  return 'I agree to participate in the assessment conducted by {{organizationName}} and understand that my responses will be used only for the stated assessment purpose.';
}

function getDefaultPrivacyStatement(accountType: CustomerWorkspaceContext['accountType']) {
  if (accountType === 'researcher') {
    return 'Your responses will be stored as confidential research data for {{organizationName}} and accessed only by authorized project reviewers. For support, contact {{supportEmail}}.';
  }

  return 'Your personal information and responses will be handled as confidential assessment data for {{organizationName}} and accessed only by authorized reviewers. For support, contact {{supportEmail}}.';
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readNullableNumber(value: unknown, fallback: number | null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.round(parsed);
}

function readRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

export function getDefaultCustomerWorkspaceSettings(context: CustomerWorkspaceContext): CustomerWorkspaceSettings {
  return {
    brandName: context.organizationName.trim(),
    brandTagline: getDefaultBrandTagline(context.accountType),
    supportEmail: context.email.trim().toLowerCase(),
    contactPerson: context.fullName.trim(),
    defaultAssessmentPurpose: getDefaultAssessmentPurpose(context.accountType),
    defaultAdministrationMode: 'remote_unsupervised',
    defaultResultVisibility: getDefaultResultVisibility(context.accountType),
    defaultParticipantLimit: getDefaultParticipantLimit(context.accountType),
    defaultTimeLimitMinutes: getDefaultTimeLimit(context.accountType),
    defaultConsentStatement: getDefaultConsentStatement(context.accountType),
    defaultPrivacyStatement: getDefaultPrivacyStatement(context.accountType),
  };
}

export function parseCustomerWorkspaceSettings(raw: unknown, context: CustomerWorkspaceContext): CustomerWorkspaceSettings {
  const defaults = getDefaultCustomerWorkspaceSettings(context);
  let parsedRaw: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsedRaw = JSON.parse(raw) as unknown;
    } catch {
      parsedRaw = null;
    }
  }
  const record = readRecord(parsedRaw);

  const defaultAssessmentPurpose = record.defaultAssessmentPurpose;
  const defaultAdministrationMode = record.defaultAdministrationMode;
  const defaultResultVisibility = record.defaultResultVisibility;

  return {
    brandName: readString(record.brandName, defaults.brandName),
    brandTagline: readString(record.brandTagline, defaults.brandTagline),
    supportEmail: readString(record.supportEmail, defaults.supportEmail),
    contactPerson: readString(record.contactPerson, defaults.contactPerson),
    defaultAssessmentPurpose:
      defaultAssessmentPurpose === 'recruitment' ||
      defaultAssessmentPurpose === 'employee_development' ||
      defaultAssessmentPurpose === 'academic_evaluation' ||
      defaultAssessmentPurpose === 'research' ||
      defaultAssessmentPurpose === 'self_assessment'
        ? defaultAssessmentPurpose
        : defaults.defaultAssessmentPurpose,
    defaultAdministrationMode:
      defaultAdministrationMode === 'supervised' || defaultAdministrationMode === 'remote_unsupervised'
        ? defaultAdministrationMode
        : defaults.defaultAdministrationMode,
    defaultResultVisibility:
      defaultResultVisibility === 'participant_summary' || defaultResultVisibility === 'review_required'
        ? defaultResultVisibility
        : defaults.defaultResultVisibility,
    defaultParticipantLimit: readNullableNumber(record.defaultParticipantLimit, defaults.defaultParticipantLimit),
    defaultTimeLimitMinutes: readNullableNumber(record.defaultTimeLimitMinutes, defaults.defaultTimeLimitMinutes),
    defaultConsentStatement: readString(record.defaultConsentStatement, defaults.defaultConsentStatement),
    defaultPrivacyStatement: readString(record.defaultPrivacyStatement, defaults.defaultPrivacyStatement),
  };
}

export function renderWorkspaceTemplate(
  template: string,
  values: {
    organizationName: string;
    brandName: string;
    contactPerson: string;
    supportEmail: string;
  },
) {
  return template.replace(/\{\{\s*(organizationName|brandName|contactPerson|supportEmail)\s*\}\}/g, (_, key: keyof typeof values) => {
    const value = values[key];
    return typeof value === 'string' ? value.trim() : '';
  });
}

