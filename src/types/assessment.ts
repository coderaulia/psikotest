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
  submissionAccessToken: string;
  status: 'in_progress';
  testType: TestTypeCode;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: 'super_admin' | 'admin';
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminUser;
}

export interface DashboardSummaryCard {
  label: string;
  value: string;
  delta: string;
}

export interface DashboardDistributionItem {
  label: string;
  value: number;
}

export interface DashboardLiveSessionItem {
  id: number;
  title: string;
  testType: string;
  status: string;
  participants: number;
  completed: number;
}

export interface DashboardRecentParticipantItem {
  id: number;
  fullName: string;
  testType: string;
  completedAt: string;
  summary: string;
}

export interface DashboardSummaryResponse {
  summaryCards: DashboardSummaryCard[];
  distributions: {
    disc: DashboardDistributionItem[];
    workload: DashboardDistributionItem[];
  };
  liveSessions: DashboardLiveSessionItem[];
  recentParticipants: DashboardRecentParticipantItem[];
}

export interface ParticipantListItem {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  latestTestType: TestTypeCode | null;
  latestStatus: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  totalSubmissions: number;
  lastActivityAt: string | null;
}

export interface SessionParticipantProgressItem {
  submissionId: number;
  participantId: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  attemptNo: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  startedAt: string | null;
  submittedAt: string | null;
  resultId: number | null;
  scoreTotal: number | null;
  scoreBand: string | null;
  profileCode: string | null;
}

export interface AdminTestSessionListItem {
  id: number;
  title: string;
  description: string | null;
  testType: TestTypeCode;
  status: 'draft' | 'active' | 'completed' | 'archived';
  accessToken: string;
  participantCount: number;
  completedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  timeLimitMinutes: number | null;
}

export interface AdminTestSessionDetail extends AdminTestSessionListItem {
  instructions: string[];
  completionRate: number;
  participants: SessionParticipantProgressItem[];
}

export interface CreateTestSessionPayload {
  title: string;
  testType: TestTypeCode;
  description?: string;
  instructions?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeLimitMinutes?: number;
  status: 'draft' | 'active';
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
  participantEmail: string;
  department: string | null;
  positionTitle: string | null;
  sessionId: number;
  sessionTitle: string;
  accessToken: string;
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

export interface StoredResultDetailRecord extends StoredResultRecord {
  participant: {
    id: number;
    fullName: string;
    email: string;
    employeeCode: string | null;
    department: string | null;
    positionTitle: string | null;
  };
  session: {
    id: number;
    title: string;
    accessToken: string;
    testType: TestTypeCode;
  };
}

export interface SubmitSubmissionResponse {
  submissionId: number;
  participantId: number;
  status: 'scored';
  resultId: number;
  result: StoredResultDetailRecord;
}
