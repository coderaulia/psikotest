import { adminFetchJson } from './admin-api';
import type {
  AdminTestSessionDetail,
  AdminTestSessionListItem,
  CreateTestSessionPayload,
  DashboardSummaryResponse,
  ParticipantListItem,
  QuestionBankQuestionDetail,
  QuestionBankQuestionListItem,
  QuestionBankQuestionPayload,
  ReportsSummaryResponse,
  ResultReviewStatus,
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
} = {}) {
  const query = buildQuery({
    search: filters.search,
    testType: filters.testType && filters.testType !== 'all' ? filters.testType : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const payload = await adminFetchJson<{ items: StoredResultRecord[] }>(`/results${query}`);
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

