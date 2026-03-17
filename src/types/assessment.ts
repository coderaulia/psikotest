export type TestTypeCode = 'iq' | 'disc' | 'workload' | 'custom';
export type QuestionType = 'single_choice' | 'forced_choice' | 'likert';
export type AssessmentPurpose = 'recruitment' | 'employee_development' | 'academic_evaluation' | 'research' | 'self_assessment';
export type AdministrationMode = 'supervised' | 'remote_unsupervised';
export type InterpretationMode = 'self_assessment' | 'professional_review';
export type ParticipantResultMode = 'instant_summary' | 'review_required';
export type ResultReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';
export type QuestionStatus = 'draft' | 'active' | 'archived';

export interface TestSessionComplianceSettings {
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  interpretationMode: InterpretationMode;
  participantResultMode: ParticipantResultMode;
  participantLimit: number | null;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
}

export interface SessionSettingsPayload {
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  interpretationMode: InterpretationMode;
  participantLimit: number | null;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
}

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
    compliance: TestSessionComplianceSettings;
  };
  questions: AssessmentQuestion[];
}

export interface ParticipantConsentState {
  consentAcceptedAt: string;
}

export interface ParticipantIdentityPayload {
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

export interface StartSubmissionResponse {
  submissionId: number;
  participantId: number;
  token: string;
  submissionAccessToken: string;
  status: 'in_progress';
  testType: TestTypeCode;
  participantResultMode: ParticipantResultMode;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminUser;
}

export type CustomerAccountType = 'business' | 'researcher';
export type CustomerAssessmentResultVisibility = 'participant_summary' | 'review_required';

export interface CustomerUser {
  id: number;
  fullName: string;
  email: string;
  accountType: CustomerAccountType;
  organizationName: string;
}

export interface CustomerAuthResponse {
  token: string;
  account: CustomerUser;
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

export interface CustomerWorkspaceSettingsResponse {
  account: CustomerUser;
  settings: CustomerWorkspaceSettings;
}

export interface UpdateCustomerWorkspaceSettingsPayload {
  organizationName: string;
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

export interface CustomerAssessmentItem {
  assessmentId: number;
  sessionId: number;
  title: string;
  organizationName: string;
  testType: TestTypeCode;
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  resultVisibility: CustomerAssessmentResultVisibility;
  timeLimitMinutes: number | null;
  participantLimit: number | null;
  sessionStatus: 'draft' | 'active' | 'completed' | 'archived';
  planStatus: 'trial' | 'upgraded';
  participantLink: string;
  previewDemoLink: string;
  createdAt: string;
}

export interface CreateCustomerAssessmentPayload {
  testType: TestTypeCode;
  title: string;
  purpose: AssessmentPurpose;
  organizationName: string;
  administrationMode: AdministrationMode;
  timeLimitMinutes: number | null;
  participantLimit: number | null;
  resultVisibility: CustomerAssessmentResultVisibility;
}

export interface CustomerAssessmentDetail extends CustomerAssessmentItem {
  description: string | null;
  instructions: string[];
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
  interpretationMode: InterpretationMode;
  canActivateSharing: boolean;
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

export interface ReportAverageByTypeItem {
  testType: TestTypeCode;
  averageScore: number | null;
  submissionCount: number;
}

export interface ReportRecentCompletionItem {
  id: number;
  participantName: string;
  sessionTitle: string;
  testType: TestTypeCode;
  submittedAt: string | null;
  summary: string;
  reviewStatus: ResultReviewStatus;
}

export interface ReportsSummaryResponse {
  summaryCards: DashboardSummaryCard[];
  averagesByTestType: ReportAverageByTypeItem[];
  distributions: {
    disc: DashboardDistributionItem[];
    workload: DashboardDistributionItem[];
    reviewStatus: DashboardDistributionItem[];
  };
  recentCompletions: ReportRecentCompletionItem[];
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
  reviewStatus: ResultReviewStatus | null;
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
  settings: SessionSettingsPayload;
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
  settings: SessionSettingsPayload;
}

export interface UpdateTestSessionPayload {
  title: string;
  description?: string;
  instructions?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeLimitMinutes?: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  settings: SessionSettingsPayload;
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
  reviewStatus: ResultReviewStatus;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: number | null;
  reviewerAdminId: number | null;
  releasedAt: string | null;
  releasedByAdminId: number | null;
  professionalSummary: string | null;
  recommendation: string | null;
  limitations: string | null;
  reviewerNotes: string | null;
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

export interface QuestionBankOptionPayload {
  id?: number;
  optionKey: string;
  optionText: string;
  dimensionKey?: string | null;
  valueNumber?: number | null;
  isCorrect?: boolean;
  optionOrder: number;
  scorePayload?: Record<string, unknown> | null;
}

export interface QuestionBankQuestionListItem {
  id: number;
  testType: TestTypeCode;
  questionCode: string;
  prompt: string | null;
  instructionText: string | null;
  questionGroupKey: string | null;
  dimensionKey: string | null;
  questionType: QuestionType;
  questionOrder: number;
  isRequired: boolean;
  status: QuestionStatus;
  optionCount: number;
  updatedAt: string;
}

export interface QuestionBankQuestionDetail extends QuestionBankQuestionListItem {
  questionMeta: Record<string, unknown>;
  options: QuestionBankOptionPayload[];
}

export interface QuestionBankQuestionPayload {
  testType: TestTypeCode;
  questionCode: string;
  instructionText?: string | null;
  prompt?: string | null;
  questionGroupKey?: string | null;
  dimensionKey?: string | null;
  questionType: QuestionType;
  questionOrder: number;
  isRequired: boolean;
  status: QuestionStatus;
  questionMeta?: Record<string, unknown> | null;
  options: QuestionBankOptionPayload[];
}

export interface AdminProfileSettings {
  id: number;
  fullName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface SessionDefaultsSettings {
  timeLimitMinutes: number;
  descriptionTemplate: string;
  instructions: string[];
  settings: SessionSettingsPayload;
}

export interface AuditFeedItem {
  id: number;
  actorType: 'admin' | 'participant' | 'system';
  actorAdminId: number | null;
  actorName: string | null;
  entityType: string;
  entityId: number | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SettingsOverviewResponse {
  profile: AdminProfileSettings;
  sessionDefaults: SessionDefaultsSettings;
  auditFeed: AuditFeedItem[];
}





