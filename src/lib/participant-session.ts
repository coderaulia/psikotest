import type {
  ParticipantConsentState,
  ParticipantIdentityPayload,
  ParticipantResultAccess,
  PublicSessionResponse,
  StartSubmissionResponse,
  StoredResultRecord,
  TestTypeCode,
} from '@/types/assessment';

export interface StoredParticipantSession {
  submissionId: number;
  participantId: number;
  token: string;
  submissionAccessToken: string;
  submissionAccessExpiresAt: string;
  answerSequence: number;
  testType: TestTypeCode;
  participantResultMode: 'instant_summary' | 'review_required';
  protectedDelivery?: boolean;
  totalGroups?: number;
  groupSize?: number;
  completionPageMessage: string | null;
  postSubmitRedirectUrl: string | null;
  participant: ParticipantIdentityPayload;
  result: StoredResultRecord | null;
  compliance?: {
    participantResultAccess: ParticipantResultAccess;
  };
}

function getStorageKey(token: string) {
  return `psikotest:participant:${token}`;
}

function getConsentKey(token: string) {
  return `psikotest:participant-consent:${token}`;
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
  session: Pick<PublicSessionResponse['session'], 'completionPageMessage' | 'postSubmitRedirectUrl'>,
  compliance?: { participantResultAccess: ParticipantResultAccess },
) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredParticipantSession = {
    submissionId: start.submissionId,
    participantId: start.participantId,
    token: start.token,
    submissionAccessToken: start.submissionAccessToken,
    submissionAccessExpiresAt: start.submissionAccessExpiresAt,
    answerSequence: start.answerSequence,
    testType: start.testType,
    participantResultMode: start.participantResultMode,
    protectedDelivery: start.protectedDelivery,
    totalGroups: start.totalGroups,
    groupSize: start.groupSize,
    completionPageMessage: session.completionPageMessage,
    postSubmitRedirectUrl: session.postSubmitRedirectUrl,
    participant,
    result: null,
    compliance,
  };

  window.sessionStorage.setItem(getStorageKey(token), JSON.stringify(payload));
}

export function updateParticipantSession(token: string, updates: Partial<StoredParticipantSession>) {
  if (typeof window === 'undefined') {
    return;
  }

  const existing = loadParticipantSession(token);
  if (!existing) {
    return;
  }

  const next = {
    ...existing,
    ...updates,
  } satisfies StoredParticipantSession;

  window.sessionStorage.setItem(getStorageKey(token), JSON.stringify(next));
}

export function saveParticipantResult(token: string, result: StoredResultRecord) {
  updateParticipantSession(token, { result });
}

export function saveParticipantConsent(token: string, consent: ParticipantConsentState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(getConsentKey(token), JSON.stringify(consent));
}

export function loadParticipantConsent(token: string): ParticipantConsentState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(getConsentKey(token));
  return raw ? (JSON.parse(raw) as ParticipantConsentState) : null;
}
