import { apiBaseUrl } from './api-client';
import type {
  ParticipantIdentityPayload,
  PublicSessionResponse,
  StartSubmissionResponse,
  SubmissionAnswerInput,
  SubmitSubmissionResponse,
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
    'X-Submission-Token': submissionAccessToken,
  };
}

export async function fetchPublicSession(token: string) {
  const response = await fetch(`${apiBaseUrl}/public/session/${token}`);
  return readJson<PublicSessionResponse>(response);
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

export async function savePublicAnswers(
  submissionId: number,
  submissionAccessToken: string,
  answers: SubmissionAnswerInput[],
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/answers`, {
    method: 'POST',
    headers: createSubmissionHeaders(submissionAccessToken),
    body: JSON.stringify({ answers }),
  });

  return readJson<{ saved: boolean }>(response);
}

export async function submitPublicSubmission(
  submissionId: number,
  submissionAccessToken: string,
  answers: SubmissionAnswerInput[],
) {
  const response = await fetch(`${apiBaseUrl}/public/submissions/${submissionId}/submit`, {
    method: 'POST',
    headers: createSubmissionHeaders(submissionAccessToken),
    body: JSON.stringify({ answers }),
  });

  return readJson<SubmitSubmissionResponse>(response);
}
