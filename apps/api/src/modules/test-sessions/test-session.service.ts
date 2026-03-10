interface TestSessionListItem {
  id: number;
  title: string;
  testType: string;
  status: string;
  accessToken: string;
  participantCount: number;
  completedCount: number;
  startsAt: string | null;
}

const testSessions: TestSessionListItem[] = [
  {
    id: 1,
    title: 'Graduate Hiring Batch A',
    testType: 'disc',
    status: 'active',
    accessToken: 'disc-batch-a',
    participantCount: 32,
    completedCount: 19,
    startsAt: '2026-03-10T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Leadership IQ Screening',
    testType: 'iq',
    status: 'draft',
    accessToken: 'iq-leadership',
    participantCount: 14,
    completedCount: 0,
    startsAt: '2026-03-12T09:00:00.000Z',
  },
];

export function listTestSessions() {
  return testSessions;
}

export function getTestSessionById(id: number) {
  return testSessions.find((session) => session.id === id) ?? null;
}

export function createTestSession(payload: {
  title: string;
  testType: string;
  startsAt?: string;
}) {
  const session: TestSessionListItem = {
    id: testSessions.length + 1,
    title: payload.title,
    testType: payload.testType,
    status: 'draft',
    accessToken: `${payload.testType}-${Date.now()}`,
    participantCount: 0,
    completedCount: 0,
    startsAt: payload.startsAt ?? null,
  };

  testSessions.unshift(session);

  return session;
}
