import type {
  AdministrationMode,
  AssessmentPurpose,
  DistributionPolicy,
  HrResultAccess,
  InterpretationMode,
  ParticipantResultAccess,
  ParticipantResultMode,
} from '../test-sessions/session-settings.js';

export type PublicTestTypeCode = 'iq' | 'disc' | 'workload' | 'custom';
export type PublicQuestionType = 'single_choice' | 'forced_choice' | 'likert';
export type PublicDeliveryMode = 'full' | 'progressive';

export interface AssessmentOption {
  id: number;
  key: string;
  label: string;
  dimensionKey?: string;
  value?: number;
  isCorrect?: boolean;
}

export interface AssessmentQuestion {
  id: number;
  code: string;
  questionType: PublicQuestionType;
  instructionText?: string;
  prompt?: string;
  dimensionKey?: string;
  questionGroupKey?: string;
  orderIndex?: number;
  options: AssessmentOption[];
}

export interface PublicSessionComplianceMeta {
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  interpretationMode: InterpretationMode;
  participantResultMode: ParticipantResultMode;
  participantLimit: number | null;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
  distributionPolicy: DistributionPolicy;
  protectedDeliveryMode: boolean;
  participantResultAccess: ParticipantResultAccess;
  hrResultAccess: HrResultAccess;
}

export interface PublicSessionDeliveryMeta {
  mode: PublicDeliveryMode;
  totalQuestions: number;
  totalGroups: number;
}

export interface PublicSessionMeta {
  id: number;
  title: string;
  testType: PublicTestTypeCode;
  instructions: string[];
  estimatedMinutes: number;
  status: 'active';
  compliance: PublicSessionComplianceMeta;
  delivery: PublicSessionDeliveryMeta;
}

export interface PublicSessionDefinition {
  session: PublicSessionMeta;
  questions: AssessmentQuestion[];
}

export interface ParticipantIdentityInput {
  fullName: string;
  email: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  appliedPosition?: string;
  age?: number;
  educationLevel?: string;
  consentAccepted: true;
  consentAcceptedAt: string;
}

export interface SubmissionAnswerInput {
  questionId: number;
  mostOptionId?: number;
  leastOptionId?: number;
  selectedOptionId?: number;
  value?: number;
}

export interface ProgressiveQuestionWindow {
  submissionId: number;
  status: 'in_progress';
  answerSequence: number;
  groupIndex: number;
  totalGroups: number;
  totalQuestions: number;
  answeredQuestionCount: number;
  groupKey: string;
  questions: AssessmentQuestion[];
  savedAnswers: SubmissionAnswerInput[];
}

export interface StartSubmissionResponse {
  submissionId: number;
  participantId: number;
  token: string;
  submissionAccessToken: string;
  submissionAccessExpiresAt: string;
  answerSequence: number;
  status: 'in_progress';
  testType: PublicTestTypeCode;
  participantResultMode: ParticipantResultMode;
}

export interface SaveSubmissionAnswersResponse {
  submissionId: number;
  saved: boolean;
  answerSequence: number;
  answeredQuestionCount: number;
  status: 'in_progress';
}

export interface SubmissionRecord {
  submissionId: number;
  participantId: number;
  token: string;
  submissionAccessToken: string;
  participant: ParticipantIdentityInput;
  testType: PublicTestTypeCode;
  participantResultMode: ParticipantResultMode;
  status: 'in_progress' | 'submitted' | 'scored';
  startedAt: string;
  submittedAt: string | null;
  answers: SubmissionAnswerInput[];
  resultId: number | null;
}
