import { adminFetchJson } from './admin-api';
import type {
  AdminTestSessionDetail,
  AdminTestSessionListItem,
  CreateTestSessionPayload,
  CustomerAccountStatus,
  CustomerListItem,
  DashboardSummaryResponse,
  ParticipantListItem,
  QuestionBankQuestionDetail,
  QuestionBankQuestionListItem,
  QuestionBankQuestionPayload,
  ReportsSummaryResponse,
  ResultReviewStatus,
  ReviewerAdminOption,
  ReviewerQueueScope,
  ReviewerQueueSummary,
  SettingsOverviewResponse,
  StoredResultDetailRecord,
  StoredResultRecord,
  TestTypeCode,
  UpdateTestSessionPayload,
} from '@/types/assessment';

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function fetchDashboardSummary() {
  return adminFetchJson<DashboardSummaryResponse>('/dashboard/summary');
}

export async function fetchReportsSummary() {
  return adminFetchJson<ReportsSummaryResponse>('/reports/summary');
}

export async function fetchParticipants(search?: string) {
  const query = buildQuery({ search });
  const payload = await adminFetchJson<{ items: ParticipantListItem[] }>(`/participants${query}`);
  return payload.items;
}

export async function fetchTestSessions(filters: {
  search?: string;
  status?: string;
  testType?: TestTypeCode | 'all';
} = {}) {
  const query = buildQuery({
    search: filters.search,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    testType: filters.testType && filters.testType !== 'all' ? filters.testType : undefined,
  });
  const payload = await adminFetchJson<{ items: AdminTestSessionListItem[] }>(`/test-sessions${query}`);
  return payload.items;
}

export async function fetchTestSessionDetail(id: number) {
  return adminFetchJson<AdminTestSessionDetail>(`/test-sessions/${id}`);
}

export async function createAdminTestSession(payload: CreateTestSessionPayload) {
  return adminFetchJson<AdminTestSessionDetail>('/test-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminTestSession(id: number, payload: UpdateTestSessionPayload) {
  return adminFetchJson<AdminTestSessionDetail>(`/test-sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchResults(filters: {
  search?: string;
  testType?: TestTypeCode | 'all';
  dateFrom?: string;
  dateTo?: string;
  reviewStatus?: ResultReviewStatus | 'all';
} = {}) {
  const query = buildQuery({
    search: filters.search,
    testType: filters.testType && filters.testType !== 'all' ? filters.testType : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    reviewStatus: filters.reviewStatus && filters.reviewStatus !== 'all' ? filters.reviewStatus : undefined,
  });
  const payload = await adminFetchJson<{ items: StoredResultRecord[] }>(`/results${query}`);
  return payload.items;
}

export async function fetchReviewerQueue(scope: ReviewerQueueScope = 'all') {
  const query = buildQuery({ scope });
  const payload = await adminFetchJson<{ items: StoredResultRecord[] }>(`/results/reviewer-queue${query}`);
  return payload.items;
}

export async function fetchReviewerQueueSummary() {
  return adminFetchJson<ReviewerQueueSummary>('/results/reviewer-queue/summary');
}

export async function fetchReviewerOptions() {
  const payload = await adminFetchJson<{ items: ReviewerAdminOption[] }>('/results/reviewers');
  return payload.items;
}

export async function fetchResultDetail(id: number) {
  return adminFetchJson<StoredResultDetailRecord>(`/results/${id}`);
}

export async function updateAdminResultReviewStatus(id: number, reviewStatus: ResultReviewStatus) {
  return adminFetchJson<StoredResultDetailRecord>(`/results/${id}/review-status`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewStatus }),
  });
}

export async function updateAdminResultReview(id: number, payload: {
  reviewStatus?: ResultReviewStatus;
  professionalSummary?: string | null;
  recommendation?: string | null;
  limitations?: string | null;
  reviewerNotes?: string | null;
}) {
  return adminFetchJson<StoredResultDetailRecord>(`/results/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function assignAdminResultReviewer(id: number, reviewerAdminId: number | null) {
  return adminFetchJson<StoredResultDetailRecord>(`/results/${id}/assign-reviewer`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewerAdminId }),
  });
}

export async function fetchQuestionBank(filters: {
  search?: string;
  testType?: TestTypeCode | 'all';
  status?: 'draft' | 'active' | 'archived' | 'all';
} = {}) {
  const query = buildQuery({
    search: filters.search,
    testType: filters.testType && filters.testType !== 'all' ? filters.testType : undefined,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
  });
  const payload = await adminFetchJson<{ items: QuestionBankQuestionListItem[] }>(`/question-bank/questions${query}`);
  return payload.items;
}

export async function fetchQuestionBankQuestion(id: number) {
  return adminFetchJson<QuestionBankQuestionDetail>(`/question-bank/questions/${id}`);
}

export async function createQuestionBankQuestion(payload: QuestionBankQuestionPayload) {
  return adminFetchJson<QuestionBankQuestionDetail>('/question-bank/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateQuestionBankQuestion(id: number, payload: QuestionBankQuestionPayload) {
  return adminFetchJson<QuestionBankQuestionDetail>(`/question-bank/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchSettingsOverview() {
  return adminFetchJson<SettingsOverviewResponse>('/settings');
}

export async function updateAdminProfile(payload: { fullName: string; email: string }) {
  return adminFetchJson<SettingsOverviewResponse['profile']>('/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateSessionDefaults(payload: SettingsOverviewResponse['sessionDefaults']) {
  return adminFetchJson<SettingsOverviewResponse['sessionDefaults']>('/settings/session-defaults', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchCustomers(filters: {
  search?: string;
  status?: CustomerAccountStatus | 'all';
  accountType?: 'business' | 'researcher' | 'all';
} = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.accountType && filters.accountType !== 'all') params.set('accountType', filters.accountType);
  const query = params.toString() ? `?${params.toString()}` : '';
  const payload = await adminFetchJson<{ items: CustomerListItem[] }>(`/customers${query}`);
  return payload.items;
}

export async function updateCustomerStatus(id: number, status: CustomerAccountStatus) {
  return adminFetchJson<{ id: number; status: CustomerAccountStatus }>(`/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface AdminCustomerBillingResponse {
  subscription: {
    id: number;
    planCode: string;
    status: string;
    billingCycle: string;
    trialEndsAt: string | null;
    renewsAt: string | null;
    cancelAtPeriodEnd: boolean;
    assessmentLimit: number;
    participantLimit: number;
    teamMemberLimit: number;
  };
  usage: {
    activeAssessmentCount: number;
    participantRecordCount: number;
    teamSeatCount: number;
  };
  invoices: Array<{
    id: number;
    status: string;
    amountTotal: number;
    currencyCode: string;
    issuedAt: string | null;
  }>;
}

export async function fetchCustomerBilling(id: number) {
  return adminFetchJson<AdminCustomerBillingResponse>(`/customers/${id}/billing`);
}

export async function updateCustomerBilling(id: number, payload: {
  planCode?: string;
  status?: string;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  billingCycle?: string;
}) {
  return adminFetchJson<{ success: boolean }>(`/customers/${id}/billing`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}



export async function updateAppSetting(key: string, payload: unknown) {
  return adminFetchJson(`/settings/app-settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
