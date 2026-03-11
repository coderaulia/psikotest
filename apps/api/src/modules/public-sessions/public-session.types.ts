export type PublicTestTypeCode = 'iq' | 'disc' | 'workload';
export type PublicQuestionType = 'single_choice' | 'forced_choice' | 'likert';

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
  options: AssessmentOption[];
}

export interface PublicSessionMeta {
  id: number;
  title: string;
  testType: PublicTestTypeCode;
  instructions: string[];
  estimatedMinutes: number;
  status: 'active';
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
}

export interface SubmissionAnswerInput {
  questionId: number;
  mostOptionId?: number;
  leastOptionId?: number;
  selectedOptionId?: number;
  value?: number;
}

export interface SubmissionRecord {
  submissionId: number;
  participantId: number;
  token: string;
  participant: ParticipantIdentityInput;
  testType: PublicTestTypeCode;
  status: 'in_progress' | 'submitted' | 'scored';
  startedAt: string;
  submittedAt: string | null;
  answers: SubmissionAnswerInput[];
  resultId: number | null;
}
