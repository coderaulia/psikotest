import { createTestSessionRecord, fetchTestSessionById, fetchTestSessions, updateTestSessionRecord, } from './test-session.repository.js';
export async function listTestSessions(filters = {}) {
    return fetchTestSessions(filters);
}
export async function getTestSessionById(id) {
    return fetchTestSessionById(id);
}
export async function createTestSession(payload) {
    return createTestSessionRecord(payload);
}
export async function updateTestSession(id, payload) {
    return updateTestSessionRecord(id, payload);
}
