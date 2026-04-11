export type TestTypeCode = 'iq' | 'disc' | 'workload' | 'custom';
export type QuestionType = 'single_choice' | 'forced_choice' | 'likert';
export type AssessmentPurpose = 'recruitment' | 'employee_development' | 'academic_evaluation' | 'research' | 'self_assessment';
export type AdministrationMode = 'supervised' | 'remote_unsupervised';
export type InterpretationMode = 'self_assessment' | 'professional_review';
export type ParticipantResultMode = 'instant_summary' | 'review_required';
export type ResultReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';
export type ReviewerQueueScope = 'all' | 'mine' | 'unassigned';
export type QuestionStatus = 'draft' | 'active' | 'archived';
export type DistributionPolicy = 'hr_only' | 'participant_summary' | 'full_report_with_consent';
export type ParticipantResultAccess = 'none' | 'summary' | 'full_released';
export type HrResultAccess = 'none' | 'summary' | 'full';
export type PublicDeliveryMode = 'full' | 'progressive';

export interface CustomerListItem {
  id: number;
  fullName: string;
  email: string;
  accountType: CustomerAccountType;
  organizationName: string;
  status: CustomerAccountStatus;
  lastLoginAt: string | null;
  createdAt: string | null;
  assessmentCount: number;
}

export interface TestSessionComplianceSettings {
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

export interface SessionSettingsPayload {
  assessmentPurpose: AssessmentPurpose;
  administrationMode: AdministrationMode;
  interpretationMode: InterpretationMode;
  participantLimit: number | null;
  consentStatement: string;
  privacyStatement: string;
  contactPerson: string;
  distributionPolicy: DistributionPolicy;
  protectedDeliveryMode: boolean;
  participantResultAccess: ParticipantResultAccess;
  hrResultAccess: HrResultAccess;
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
  questionGroupKey?: string;
  orderIndex?: number;
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
    completionPageMessage: string | null;
    postSubmitRedirectUrl: string | null;
    delivery: {
      mode: PublicDeliveryMode;
      totalQuestions: number;
      totalGroups: number;
    };
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

export interface ProgressiveQuestionWindow {
  submissionId: number;
  status: 'in_progress';
  answerSequence: number;
  groupIndex: number;
  currentGroup: number;
  totalGroups: number;
  groupSize?: number;
  isLastGroup: boolean;
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
  testType: TestTypeCode;
  participantResultMode: ParticipantResultMode;
  protectedDelivery?: boolean;
  totalGroups?: number;
  groupSize?: number;
}

export interface NextSubmissionGroupResponse extends ProgressiveQuestionWindow {
  complete?: boolean;
}

export interface SaveSubmissionAnswersResponse {
  submissionId: number;
  saved: boolean;
  answerSequence: number;
  answeredQuestionCount: number;
  status: 'in_progress';
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
export type CustomerAccountStatus = 'active' | 'inactive';
export type CustomerAssessmentResultVisibility = 'participant_summary' | 'review_required';
export type CustomerAssessmentParticipantStatus = 'draft' | 'invited' | 'in_progress' | 'completed';
export type CustomerAssessmentInviteChannel = 'email' | 'link';
export type DummyCheckoutPlan = 'starter' | 'growth' | 'research';
export type DummyCheckoutBillingCycle = 'monthly' | 'annual';
export type WorkspacePlanCode = DummyCheckoutPlan;
export type WorkspaceBillingCycle = DummyCheckoutBillingCycle;
export type WorkspaceSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended';
export type CustomerWorkspaceMemberRole = 'owner' | 'admin' | 'operator' | 'reviewer';
export type CustomerWorkspaceMemberStatus = 'active' | 'invited';
export type CustomerSessionSource = 'owner' | 'workspace_member';

export interface CustomerUser {
  id: number;
  fullName: string;
  email: string;
  accountType: CustomerAccountType;
  organizationName: string;
  workspaceRole: CustomerWorkspaceMemberRole;
  sessionSource: CustomerSessionSource;
  workspaceMemberId: number | null;
}

export interface CustomerAuthResponse {
  token: string;
  account: CustomerUser;
}

export type PasswordResetValidationReason = 'expired' | 'used' | 'invalid';

export interface ForgotPasswordResponse {
  success: true;
}

export interface ResetPasswordValidationResponse {
  valid: boolean;
  reason?: PasswordResetValidationReason;
}

export interface ResetPasswordResponse {
  success: true;
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
  completionPageMessage: string;
  postSubmitRedirectUrl: string;
  notifyOnSubmission: boolean;
  notifyOnReportReleased: boolean;
  notificationEmailAddress: string;
}

export interface CustomerWorkspaceSettingsResponse {
  account: CustomerUser;
  settings: CustomerWorkspaceSettings;
  lockedSettings: {
    completionPageMessage: boolean;
    postSubmitRedirectUrl: boolean;
  };
}

export interface CustomerWorkspaceMemberItem {
  id: number;
  fullName: string;
  email: string;
  role: CustomerWorkspaceMemberRole;
  status: CustomerWorkspaceMemberStatus;
  source: 'owner' | 'workspace_member';
  invitedAt: string | null;
  lastNotifiedAt: string | null;
  activatedAt: string | null;
  activationExpiresAt: string | null;
  lastLoginAt: string | null;
}

export interface CustomerWorkspaceTeamResponse {
  workspace: {
    organizationName: string;
    ownerName: string;
    ownerEmail: string;
    accountType: CustomerAccountType;
  };
  items: CustomerWorkspaceMemberItem[];
}

export interface CustomerWorkspaceActivityItem {
  id: number;
  actorType: 'admin' | 'participant' | 'system';
  actorAdminId: number | null;
  actorName: string | null;
  entityType: string;
  entityId: number | null;
  action: string;
  category: 'assessment' | 'participant_delivery' | 'team' | 'billing' | 'workspace';
  label: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CustomerWorkspaceActivityResponse {
  workspace: {
    organizationName: string;
    accountType: CustomerAccountType;
  };
  summary: {
    totalEvents: number;
    assessmentEvents: number;
    participantDeliveryEvents: number;
    teamEvents: number;
    billingEvents: number;
  };
  items: CustomerWorkspaceActivityItem[];
}
export type WorkspaceBillingProvider = 'dummy' | 'manual' | 'stripe';
export type BillingCheckoutSessionStatus = 'open' | 'completed' | 'expired' | 'failed';
export type BillingInvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type ManualPaymentStatus = 'pending' | 'paid' | 'rejected' | 'expired';

export interface WorkspaceSubscriptionRecord {
  id: number;
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billingCycle: WorkspaceBillingCycle;
  billingProvider?: WorkspaceBillingProvider;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerPriceId?: string | null;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  startedAt: string;
  trialEndsAt: string | null;
  renewsAt: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  pastDueAt?: string | null;
  suspendedAt?: string | null;
  planVersion?: number;
  billingContactEmail?: string | null;
  planLabel: string;
  planDescription: string;
}

export interface WorkspaceUsageSummary {
  activeAssessmentCount: number;
  participantRecordCount: number;
  teamSeatCount: number;
  remainingAssessmentSlots: number;
  remainingParticipantSlots: number;
  remainingTeamSeats: number;
}

export type WorkspaceUsageSeverity = 'healthy' | 'warning' | 'critical' | 'limit_reached';

export interface WorkspaceUsageDiagnostic {
  resource: 'assessments' | 'participants' | 'team_members';
  label: string;
  current: number;
  limit: number;
  remaining: number;
  utilizationPercent: number;
  severity: WorkspaceUsageSeverity;
  suggestedPlanCode: WorkspacePlanCode | null;
  suggestedPlanLabel: string | null;
  message: string;
}

export interface WorkspaceUpgradeGuidance {
  isUpgradeRecommended: boolean;
  highestSeverity: WorkspaceUsageSeverity;
  suggestedPlanCode: WorkspacePlanCode | null;
  suggestedPlanLabel: string | null;
  reasons: string[];
  isCurrentPlanSaturated: boolean;
  currentPlanCode: WorkspacePlanCode;
}

export interface WorkspacePlanDefinition {
  planCode: WorkspacePlanCode;
  label: string;
  description: string;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
  monthlyPrice?: number;
  annualPrice?: number;
}

export interface BillingCheckoutSessionRecord {
  id: number;
  customerAccountId: number;
  workspaceSubscriptionId: number;
  sessionKey: string;
  billingProvider: WorkspaceBillingProvider;
  planCode: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
  status: BillingCheckoutSessionStatus;
  checkoutUrl: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BillingInvoiceRecord {
  id: number;
  customerAccountId: number;
  workspaceSubscriptionId: number;
  checkoutSessionId: number | null;
  externalInvoiceId: string | null;
  invoiceNumber: string | null;
  status: BillingInvoiceStatus;
  currencyCode: string;
  amountSubtotal: number;
  amountTotal: number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CustomerBillingOverviewResponse {
  account: CustomerUser;
  subscription: WorkspaceSubscriptionRecord;
  usage: WorkspaceUsageSummary;
  diagnostics: WorkspaceUsageDiagnostic[];
  upgradeGuidance: WorkspaceUpgradeGuidance;
  plans: WorkspacePlanDefinition[];
  recentCheckoutSessions?: BillingCheckoutSessionRecord[];
  recentInvoices?: BillingInvoiceRecord[];
  recentManualPayments?: ManualPaymentRecord[];
}

export interface CustomerBillingInvoicesResponse {
  account: CustomerUser;
  invoices: BillingInvoiceRecord[];
}

export interface CreateWorkspaceCheckoutSessionPayload {
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}

export interface CreateWorkspaceCheckoutSessionResponse {
  checkoutSession: BillingCheckoutSessionRecord;
  overview: CustomerBillingOverviewResponse;
}

export interface UpdateWorkspaceSubscriptionPayload {
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}

export interface CreateManualPaymentPayload {
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}

export interface SubmitManualPaymentProofPayload {
  proofUrl?: string;
  senderName?: string;
  senderBank?: string;
  note?: string;
  transferAt?: number;
}

export interface ManualPaymentRecord {
  id: number;
  workspaceId: number;
  customerId: number | null;
  selectedPlan: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
  currency: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  paymentReference: string;
  paymentMethod: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  instructionsText: string | null;
  proofUrl: string | null;
  proofFilename: string | null;
  senderName: string | null;
  senderBank: string | null;
  note: string | null;
  transferAt: number | null;
  proofSubmittedAt: number | null;
  status: ManualPaymentStatus;
  expiresAt: number | null;
  verifiedAt: number | null;
  verifiedByAdminId: number | null;
  rejectionReason: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateManualPaymentResponse {
  payment: ManualPaymentRecord;
  reused: boolean;
}

export interface CustomerManualPaymentsResponse {
  payments: ManualPaymentRecord[];
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
  completionPageMessage: string;
  postSubmitRedirectUrl: string;
  notifyOnSubmission: boolean;
  notifyOnReportReleased: boolean;
  notificationEmailAddress: string;
}

export interface CreateCustomerWorkspaceMemberPayload {
  fullName: string;
  email: string;
  role: Exclude<CustomerWorkspaceMemberRole, 'owner'>;
}

export interface SendCustomerWorkspaceMemberInviteResponse {
  member: CustomerWorkspaceMemberItem;
  deliveryPreview: string;
  activationLink: string | null;
  loginLink: string | null;
  expiresAt: string | null;
}

export interface WorkspaceInvitePreviewResponse {
  invite: {
    organizationName: string;
    accountType: CustomerAccountType;
    fullName: string;
    email: string;
    role: Exclude<CustomerWorkspaceMemberRole, 'owner'>;
    expiresAt: string | null;
    isExpired: boolean;
  };
}

export interface AcceptWorkspaceInvitePayload {
  fullName: string;
  password: string;
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
  distributionPolicy: DistributionPolicy;
  protectedDeliveryMode: boolean;
  participantResultAccess: ParticipantResultAccess;
  hrResultAccess: HrResultAccess;
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
  protectedDeliveryMode: boolean;
}

export interface UpdateCustomerAssessmentPayload extends CreateCustomerAssessmentPayload {}

export interface CustomerAssessmentCheckoutPayload {
  selectedPlan: DummyCheckoutPlan;
  billingCycle: DummyCheckoutBillingCycle;
}

export interface CustomerAssessmentParticipantItem {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
  status: CustomerAssessmentParticipantStatus;
  invitedVia: CustomerAssessmentInviteChannel | null;
  invitedAt: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  lastSubmittedAt: string | null;
  submissionStatus: 'not_started' | 'in_progress' | 'submitted' | 'scored' | null;
  resultId: number | null;
}

export interface CreateCustomerAssessmentParticipantPayload {
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  positionTitle: string | null;
  note: string | null;
}

export interface SendCustomerAssessmentParticipantInvitePayload {
  channel: CustomerAssessmentInviteChannel;
}

export interface SendCustomerAssessmentBulkInvitePayload {
  channel: CustomerAssessmentInviteChannel;
}

export interface CustomerAssessmentBulkInviteResponse {
  invitedCount: number;
  skippedCount: number;
  shareLink: string;
  deliveryPreview: string;
}

export interface CustomerAssessmentBulkReminderResponse {
  remindedCount: number;
  skippedCount: number;
  shareLink: string;
  deliveryPreview: string;
}

export interface ImportCustomerAssessmentParticipantsPayload {
  rows: CreateCustomerAssessmentParticipantPayload[];
}

export interface ImportCustomerAssessmentParticipantsResponse {
  importedCount: number;
  updatedCount: number;
  totalRows: number;
}

export interface CustomerAssessmentParticipantSummary {
  total: number;
  draft: number;
  invited: number;
  inProgress: number;
  completed: number;
}

export interface CustomerAssessmentParticipantListResponse {
  assessmentId: number;
  shareLink: string;
  summary: CustomerAssessmentParticipantSummary;
  items: CustomerAssessmentParticipantItem[];
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

export interface CustomerWorkspaceResultItem {
  resultId: number;
  assessmentId: number;
  assessmentTitle: string;
  participantName: string;
  participantEmail: string;
  testType: TestTypeCode;
  submittedAt: string;
  scoreTotal: number | null;
  scoreBand: string | null;
  profileCode: string | null;
  reviewStatus: ResultReviewStatus;
  distributionPolicy: DistributionPolicy;
  participantResultAccess: ParticipantResultAccess;
  hrResultAccess: HrResultAccess;
  protectedDeliveryMode: boolean;
  releasedSummary: string | null;
  releasedRecommendation: string | null;
  releasedLimitations: string | null;
  visibilityNote: string;
}

export interface CustomerWorkspaceResultMetric {
  metricKey: string;
  metricLabel: string;
  score: number;
  band: string | null;
}

export interface CustomerWorkspaceResultDetail extends CustomerWorkspaceResultItem {
  metrics: CustomerWorkspaceResultMetric[];
}

export interface CustomerWorkspaceResultsResponse {
  summary: {
    total: number;
    released: number;
    awaitingReview: number;
    hiddenDrafts: number;
  };
  items: CustomerWorkspaceResultItem[];
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
  distributionPolicy: DistributionPolicy;
  participantResultAccess: ParticipantResultAccess;
  hrResultAccess: HrResultAccess;
  protectedDeliveryMode: boolean;
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

export interface ReviewerAdminOption {
  id: number;
  fullName: string;
  email: string;
  role: 'super_admin' | 'psychologist_reviewer';
}

export interface ReviewerQueueSummary {
  pendingCount: number;
  unassignedCount: number;
  assignedToMeCount: number;
  inReviewCount: number;
  readyForReleaseCount: number;
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
  scoreValue?: number | null;
  isCorrect?: boolean;
  isActive?: boolean;
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
  categoryKey?: string | null;
  scoringKey?: string | null;
  isReverseScored?: boolean;
  weight?: number;
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
  categoryKey?: string | null;
  scoringKey?: string | null;
  isReverseScored?: boolean;
  weight?: number;
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
  platformIdentity: {
    platformDisplayName: string;
    supportEmail: string;
    publicContactUrl: string;
  };
  complianceDefaults: {
    consentStatementTemplate: string;
    privacyStatementTemplate: string;
    reviewerAssignmentMode: 'auto_assign' | 'manual_claim';
  };
  securityDefaults: {
    submissionTokenExpiryHours: number;
    protectedDeliveryModeDefault: boolean;
    answerSequenceStrictness: 'standard' | 'strict';
  };
  customerControls: {
    defaultPlanCode: string;
    trialDurationDays: number;
    requireManualActivation: boolean;
  };
  auditFeed: AuditFeedItem[];
}






















