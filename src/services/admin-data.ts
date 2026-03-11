import { adminFetchJson } from './admin-api';
import type {
  AdminTestSessionDetail,
  AdminTestSessionListItem,
  CreateTestSessionPayload,
  DashboardSummaryResponse,
  ParticipantListItem,
  StoredResultDetailRecord,
  StoredResultRecord,
  TestTypeCode,
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
