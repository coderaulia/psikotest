import type {
  CreateTestSessionInput,
  TestSessionListFilters,
  UpdateTestSessionInput,
} from './test-session.repository.js';
import {
  createTestSessionRecord,
  fetchTestSessionById,
  fetchTestSessions,
  updateTestSessionRecord,
} from './test-session.repository.js';

export async function listTestSessions(filters: TestSessionListFilters = {}) {
  return fetchTestSessions(filters);
}

export async function getTestSessionById(id: number) {
  return fetchTestSessionById(id);
}

export async function createTestSession(payload: CreateTestSessionInput) {
  return createTestSessionRecord(payload);
}

export async function updateTestSession(id: number, payload: UpdateTestSessionInput) {
  return updateTestSessionRecord(id, payload);
}
