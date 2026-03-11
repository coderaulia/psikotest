export type AssessmentPurpose =
  | 'recruitment'
  | 'employee_development'
  | 'academic_evaluation'
  | 'research'
  | 'self_assessment';

export type AdministrationMode = 'supervised' | 'remote_unsupervised';
export type InterpretationMode = 'self_assessment' | 'professional_review';
export type ParticipantResultMode = 'instant_summary' | 'review_required';

export interface TestSessionSettings {
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  interpretationMode: InterpretationMode;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
}

const defaultConsentStatement =
  'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.';
const defaultPrivacyStatement =
  'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.';
const defaultContactPerson = 'Assessment administrator';

export function getDefaultTestSessionSettings(): TestSessionSettings {
  return {
    assessmentPurpose: 'self_assessment',
    administrationMode: 'remote_unsupervised',
    interpretationMode: 'self_assessment',
    consentStatement: defaultConsentStatement,
    privacyStatement: defaultPrivacyStatement,
    contactPerson: defaultContactPerson,
  };
}

export function parseTestSessionSettings(
  rawValue: string | Record<string, unknown> | null | undefined,
): TestSessionSettings {
  const defaults = getDefaultTestSessionSettings();

  if (!rawValue) {
    return defaults;
  }

  const parsed =
    typeof rawValue === 'string'
      ? (JSON.parse(rawValue) as Record<string, unknown>)
      : rawValue;

  return {
    assessmentPurpose:
      typeof parsed.assessmentPurpose === 'string'
        ? (parsed.assessmentPurpose as AssessmentPurpose)
        : defaults.assessmentPurpose,
    administrationMode:
      typeof parsed.administrationMode === 'string'
        ? (parsed.administrationMode as AdministrationMode)
        : defaults.administrationMode,
    interpretationMode:
      typeof parsed.interpretationMode === 'string'
        ? (parsed.interpretationMode as InterpretationMode)
        : defaults.interpretationMode,
    consentStatement:
      typeof parsed.consentStatement === 'string' && parsed.consentStatement.trim().length > 0
        ? parsed.consentStatement.trim()
        : defaults.consentStatement,
    privacyStatement:
      typeof parsed.privacyStatement === 'string' && parsed.privacyStatement.trim().length > 0
        ? parsed.privacyStatement.trim()
        : defaults.privacyStatement,
    contactPerson:
      typeof parsed.contactPerson === 'string' && parsed.contactPerson.trim().length > 0
        ? parsed.contactPerson.trim()
        : defaults.contactPerson,
  };
}

export function getParticipantResultMode(settings: TestSessionSettings): ParticipantResultMode {
  return settings.interpretationMode === 'professional_review'
    ? 'review_required'
    : 'instant_summary';
}
