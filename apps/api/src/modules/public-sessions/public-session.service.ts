import { HttpError } from '../../lib/http-error.js';
import { createSubmissionAccessToken, verifySubmissionAccessToken } from '../../lib/signed-token.js';
import { storeResult } from '../results/result.service.js';
import { scoreAssessment } from '../scoring/score-assessment.js';
import {
  createSubmissionForToken,
  findPublicSessionByToken,
  loadSubmissionScoringContext,
  replaceSubmissionAnswers,
} from './public-session.repository.js';
import type {
  ParticipantIdentityInput,
  SubmissionAnswerInput,
} from './public-session.types.js';

function assertSubmissionAccess(submissionId: number, submissionAccessToken: string) {
  const claims = verifySubmissionAccessToken(submissionAccessToken);

  if (!claims || claims.submissionId !== submissionId) {
    throw new HttpError(403, 'Invalid or expired submission access token');
  }

  return claims;
}

export async function getPublicSession(token: string) {
  const session = await findPublicSessionByToken(token);

  if (!session) {
    throw new HttpError(404, 'Public session not found');
  }

  return session;
}

export async function startPublicSubmission(token: string, participant: ParticipantIdentityInput) {
  const submission = await createSubmissionForToken(token, participant);

  if (!submission) {
    throw new HttpError(404, 'Public session not found');
  }

  return {
    ...submission,
    submissionAccessToken: createSubmissionAccessToken({
      submissionId: submission.submissionId,
      participantId: submission.participantId,
    }),
  };
}

export async function saveSubmissionAnswers(
  submissionId: number,
  submissionAccessToken: string,
  answers: SubmissionAnswerInput[],
) {
  assertSubmissionAccess(submissionId, submissionAccessToken);
  return replaceSubmissionAnswers(submissionId, answers);
}

export async function submitPublicSubmission(
  submissionId: number,
  submissionAccessToken: string,
  answers?: SubmissionAnswerInput[],
) {
  assertSubmissionAccess(submissionId, submissionAccessToken);

  if (answers && answers.length > 0) {
    await replaceSubmissionAnswers(submissionId, answers);
  }

  const context = await loadSubmissionScoringContext(submissionId);

  if (!context) {
    throw new HttpError(404, 'Submission not found');
  }

  if (context.answers.length === 0) {
    throw new HttpError(400, 'Cannot submit without answers');
  }

  const submittedAt = new Date().toISOString();
  const scoredResult = scoreAssessment({
    participantId: context.participantId,
    definition: context.definition,
    answers: context.answers,
  });

  const storedResult = await storeResult({
    submissionId: context.submissionId,
    participantId: context.participantId,
    participantName: context.participantName,
    testType: context.testType,
    submittedAt,
    scoredResult,
  });

  return {
    submissionId: context.submissionId,
    participantId: context.participantId,
    status: 'scored' as const,
    resultId: storedResult.id,
    result: storedResult,
  };
}
