import type {
  ParticipantIdentityPayload,
  StartSubmissionResponse,
  StoredResultRecord,
  TestTypeCode,
} from '@/types/assessment';

export interface StoredParticipantSession {
  submissionId: number;
  participantId: number;
  token: string;
  testType: TestTypeCode;
  participant: ParticipantIdentityPayload;
  result: StoredResultRecord | null;
}

function getStorageKey(token: string) {
  return `psikotest:participant:${token}`;
}

export function loadParticipantSession(token: string): StoredParticipantSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(getStorageKey(token));
  return raw ? (JSON.parse(raw) as StoredParticipantSession) : null;
}

export function saveParticipantSession(
  token: string,
  start: StartSubmissionResponse,
  participant: ParticipantIdentityPayload,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredParticipantSession = {
    submissionId: start.submissionId,
    participantId: start.participantId,
    token: start.token,
    testType: start.testType,
    participant,
    result: null,
  };

  window.sessionStorage.setItem(getStorageKey(token), JSON.stringify(payload));
}

export function saveParticipantResult(token: string, result: StoredResultRecord) {
  if (typeof window === 'undefined') {
    return;
  }

  const existing = loadParticipantSession(token);
  if (!existing) {
    return;
  }

  existing.result = result;
  window.sessionStorage.setItem(getStorageKey(token), JSON.stringify(existing));
}
