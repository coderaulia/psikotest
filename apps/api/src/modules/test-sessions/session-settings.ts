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
  participantLimit: number | null;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
}

const defaultConsentStatement =
  'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.';
const defaultResearchConsentStatement =
  'I agree to participate in this psychological research questionnaire and understand that my responses will be collected for academic or research analysis.';
const defaultPrivacyStatement =
  'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.';
const defaultResearchPrivacyStatement =
  'Your responses will be stored as confidential research data and used only by authorized lecturers, students, or research supervisors.';
const defaultContactPerson = 'Assessment administrator';
const defaultResearchContactPerson = 'Research coordinator';

export function getDefaultTestSessionSettings(overrides: Partial<TestSessionSettings> = {}): TestSessionSettings {
  const base: TestSessionSettings = {
    assessmentPurpose: 'self_assessment',
    administrationMode: 'remote_unsupervised',
    interpretationMode: 'self_assessment',
    participantLimit: null,
    consentStatement: defaultConsentStatement,
    privacyStatement: defaultPrivacyStatement,
    contactPerson: defaultContactPerson,
  };

  return {
    ...base,
    ...overrides,
  };
}

export function getDefaultResearchSessionSettings(): TestSessionSettings {
  return getDefaultTestSessionSettings({
    assessmentPurpose: 'research',
    interpretationMode: 'self_assessment',
    participantLimit: 100,
    consentStatement: defaultResearchConsentStatement,
    privacyStatement: defaultResearchPrivacyStatement,
    contactPerson: defaultResearchContactPerson,
  });
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

  const participantLimitValue =
    typeof parsed.participantLimit === 'number' && Number.isFinite(parsed.participantLimit)
      ? Math.max(1, Math.round(parsed.participantLimit))
      : null;

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
    participantLimit: participantLimitValue,
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
