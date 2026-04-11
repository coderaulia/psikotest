import { apiBaseUrl } from './api-client';
import type {
  DistributionPolicy,
  ParticipantIdentityPayload,
  ParticipantResultAccess,
  ParticipantResultMode,
  NextSubmissionGroupResponse,
  ProgressiveQuestionWindow,
  PublicSessionResponse,
  SaveSubmissionAnswersResponse,
  StartSubmissionResponse,
  SubmissionAnswerInput,
  SubmitSubmissionResponse,
  TestSessionComplianceSettings,
} from '@/types/assessment';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Request failed');
  }

  return (await response.json()) as T;
}

function createSubmissionHeaders(submissionAccessToken: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${submissionAccessToken}`,
    'X-Submission-Token': submissionAccessToken,
  };
}

function defaultCompliance(): TestSessionComplianceSettings {
  return {
    assessmentPurpose: 'recruitment',
    administrationMode: 'remote_unsupervised',
    interpretationMode: 'professional_review',
    participantResultMode: 'instant_summary',
    participantLimit: null,
    consentStatement:
      'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
    privacyStatement:
      'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
    contactPerson: 'HR Assessment Desk',
    distributionPolicy: 'participant_summary',
    protectedDeliveryMode: false,
    participantResultAccess: 'summary',
    hrResultAccess: 'full',
  };
}

function normalizeCompliance(input: unknown): TestSessionComplianceSettings {
  const defaults = defaultCompliance();
  const value = (input && typeof input === 'object' ? input : {}) as Partial<TestSessionComplianceSettings>;

  return {
    ...defaults,
    ...value,
    participantResultMode: (value.participantResultMode ?? defaults.participantResultMode) as ParticipantResultMode,
    distributionPolicy: (value.distributionPolicy ?? defaults.distributionPolicy) as DistributionPolicy,
    participantResultAccess: (value.participantResultAccess ?? defaults.participantResultAccess) as ParticipantResultAccess,
    hrResultAccess: value.hrResultAccess ?? defaults.hrResultAccess,
  };
}

function normalizePublicSession(payload: unknown): PublicSessionResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid public session response');
  }

  const root = payload as Record<string, unknown>;
  const rawSession = (root.session && typeof root.session === 'object' ? root.session : {}) as Record<string, unknown>;
  const rawQuestions = Array.isArray(root.questions) ? root.questions : [];
  const rawCompliance = rawSession.compliance ?? rawSession.settings;
  const compliance = normalizeCompliance(rawCompliance);
  const rawDelivery =
    rawSession.delivery && typeof rawSession.delivery === 'object'
      ? (rawSession.delivery as Record<string, unknown>)
      : {};

  return {
    session: {
      id: Number(rawSession.id ?? 0),
      title: String(rawSession.title ?? 'Assessment session'),
      testType: String(rawSession.testType ?? 'disc') as PublicSessionResponse['session']['testType'],
      instructions: Array.isArray(rawSession.instructions) ? (rawSession.instructions as string[]) : [],
      estimatedMinutes: Number(rawSession.estimatedMinutes ?? 10),
      status: 'active',
      compliance,
      completionPageMessage: typeof rawSession.completionPageMessage === 'string' && rawSession.completionPageMessage ? rawSession.completionPageMessage : null,
      postSubmitRedirectUrl: typeof rawSession.postSubmitRedirectUrl === 'string' && rawSession.postSubmitRedirectUrl ? rawSession.postSubmitRedirectUrl : null,
      delivery: {
        mode: rawDelivery.mode === 'progressive' ? 'progressive' : 'full',
        totalQuestions: Number(rawDelivery.totalQuestions ?? rawQuestions.length),
        totalGroups: Number(rawDelivery.totalGroups ?? 0),
      },
    },
    questions: rawQuestions as PublicSessionResponse['questions'],
  };
}

export async function fetchPublicSession(token: string) {
  const response = await fetch(`${apiBaseUrl}/public/session/${token}`);
  const payload = await readJson<unknown>(response);
  return normalizePublicSession(payload);
}

export async function startPublicSubmission(token: string, payload: ParticipantIdentityPayload) {
  const response = await fetch(`${apiBaseUrl}/public/session/${token}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson<StartSubmissionResponse>(response);
}

export async function fetchSubmissionQuestionWindow(
  submissionId: number,
  submissionAccessToken: string,
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/questions`, {
    headers: createSubmissionHeaders(submissionAccessToken),
  });

  return readJson<ProgressiveQuestionWindow>(response);
}

export async function fetchNextSubmissionGroup(
  submissionId: number,
  submissionAccessToken: string,
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/next-group`, {
    method: 'POST',
    headers: createSubmissionHeaders(submissionAccessToken),
  });

  return readJson<NextSubmissionGroupResponse>(response);
}

export async function savePublicAnswers(
  submissionId: number,
  submissionAccessToken: string,
  answerSequence: number,
  answers: SubmissionAnswerInput[],
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/answers`, {
    method: 'POST',
    headers: createSubmissionHeaders(submissionAccessToken),
    body: JSON.stringify({ answerSequence, answers }),
  });

  return readJson<SaveSubmissionAnswersResponse>(response);
}

export async function submitPublicSubmission(
  submissionId: number,
  submissionAccessToken: string,
  answerSequence?: number,
  answers?: SubmissionAnswerInput[],
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/submit`, {
    method: 'POST',
    headers: createSubmissionHeaders(submissionAccessToken),
    body: JSON.stringify({ answerSequence, answers }),
  });

  return readJson<SubmitSubmissionResponse>(response);
}
