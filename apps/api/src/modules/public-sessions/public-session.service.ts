import { HttpError } from '../../lib/http-error.js';
import { storeResult } from '../results/result.service.js';
import { scoreAssessment } from '../scoring/score-assessment.js';
import { publicSessions } from './public-session.data.js';
import type {
  ParticipantIdentityInput,
  PublicSessionDefinition,
  SubmissionAnswerInput,
  SubmissionRecord,
} from './public-session.types.js';

const submissionStore = new Map<number, SubmissionRecord>();

function getSessionDefinitionByToken(token: string): PublicSessionDefinition {
  const definition = publicSessions[token];

  if (!definition) {
    throw new HttpError(404, 'Public session not found');
  }

  return definition;
}

function getStoredSubmission(submissionId: number) {
  const submission = submissionStore.get(submissionId);

  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  return submission;
}

export function getPublicSession(token: string) {
  return getSessionDefinitionByToken(token);
}

export function startPublicSubmission(token: string, participant: ParticipantIdentityInput) {
  const definition = getSessionDefinitionByToken(token);
  const submissionId = Date.now();
  const participantId = submissionId;

  const record: SubmissionRecord = {
    submissionId,
    participantId,
    token,
    participant,
    testType: definition.session.testType,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    submittedAt: null,
    answers: [],
    resultId: null,
  };

  submissionStore.set(submissionId, record);

  return {
    submissionId,
    participantId,
    token,
    status: record.status,
    testType: record.testType,
  };
}

export function saveSubmissionAnswers(submissionId: number, answers: SubmissionAnswerInput[]) {
  const record = getStoredSubmission(submissionId);

  record.answers = answers;
  submissionStore.set(submissionId, record);

  return {
    submissionId,
    saved: true,
    answerCount: answers.length,
    status: record.status,
  };
}

export function submitPublicSubmission(submissionId: number, answers?: SubmissionAnswerInput[]) {
  const record = getStoredSubmission(submissionId);
  const definition = getSessionDefinitionByToken(record.token);

  if (answers && answers.length > 0) {
    record.answers = answers;
  }

  if (record.answers.length === 0) {
    throw new HttpError(400, 'Cannot submit without answers');
  }

  const submittedAt = new Date().toISOString();
  const scoredResult = scoreAssessment({
    participantId: record.participantId,
    definition,
    answers: record.answers,
  });

  const storedResult = storeResult({
    submissionId: record.submissionId,
    participantId: record.participantId,
    participantName: record.participant.fullName,
    testType: record.testType,
    submittedAt,
    scoredResult,
  });

  record.status = 'scored';
  record.submittedAt = submittedAt;
  record.resultId = storedResult.id;
  submissionStore.set(submissionId, record);

  return {
    submissionId: record.submissionId,
    participantId: record.participantId,
    status: record.status,
    resultId: storedResult.id,
    result: storedResult,
  };
}
