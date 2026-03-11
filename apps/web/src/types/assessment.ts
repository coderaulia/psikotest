export type TestTypeCode = 'iq' | 'disc' | 'workload';
export type QuestionType = 'single_choice' | 'forced_choice' | 'likert';

export interface AssessmentOption {
  id: number;
  key: string;
  label: string;
  dimensionKey?: string;
  value?: number;
}

export interface AssessmentQuestion {
  id: number;
  code: string;
  questionType: QuestionType;
  instructionText?: string;
  prompt?: string;
  dimensionKey?: string;
  options: AssessmentOption[];
}

export interface PublicSessionResponse {
  session: {
    id: number;
    title: string;
    testType: TestTypeCode;
    instructions: string[];
    estimatedMinutes: number;
    status: 'active';
  };
  questions: AssessmentQuestion[];
}

export interface ParticipantIdentityPayload {
  fullName: string;
  email: string;
  employeeCode?: string;
  department?: string;
  position?: string;
}

export interface SubmissionAnswerInput {
  questionId: number;
  mostOptionId?: number;
  leastOptionId?: number;
  selectedOptionId?: number;
  value?: number;
}

export interface StartSubmissionResponse {
  submissionId: number;
  participantId: number;
  token: string;
  status: 'in_progress';
  testType: TestTypeCode;
}

export interface StoredResultSummary {
  metricKey: string;
  metricLabel: string;
  score: number;
  band?: string | null;
}

export interface StoredResultRecord {
  id: number;
  submissionId: number;
  participantId: number;
  participantName: string;
  testType: TestTypeCode;
  submittedAt: string;
  scoreTotal: number | null;
  scoreBand: string | null;
  primaryType: string | null;
  secondaryType: string | null;
  profileCode: string | null;
  interpretationKey: string | null;
  resultPayload: Record<string, unknown>;
  summaries: StoredResultSummary[];
}

export interface SubmitSubmissionResponse {
  submissionId: number;
  participantId: number;
  status: 'scored';
  resultId: number;
  result: StoredResultRecord;
}
