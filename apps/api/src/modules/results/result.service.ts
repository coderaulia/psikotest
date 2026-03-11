import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';

export interface StoredResultRecord {
  id: number;
  submissionId: number;
  participantId: number;
  participantName: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoreTotal: number | null;
  scoreBand: string | null;
  primaryType: string | null;
  secondaryType: string | null;
  profileCode: string | null;
  interpretationKey: string | null;
  resultPayload: Record<string, unknown>;
  summaries: ResultSummaryItem[];
}

const results: StoredResultRecord[] = [
  {
    id: 501,
    submissionId: 9001,
    participantId: 101,
    participantName: 'Nadia Pratama',
    testType: 'disc',
    submittedAt: '2026-03-09T10:00:00.000Z',
    scoreTotal: 4,
    scoreBand: null,
    primaryType: 'I',
    secondaryType: 'D',
    profileCode: 'I/D',
    interpretationKey: 'disc_i',
    resultPayload: {
      participantId: 101,
      scores: { D: 1, I: 2, S: 1, C: 0 },
      leastScores: { D: 0, I: 0, S: 1, C: 1 },
      balanceScores: { D: 1, I: 2, S: 0, C: -1 },
      primaryType: 'I',
      secondaryType: 'D',
      profileCode: 'I/D',
    },
    summaries: [
      { metricKey: 'D', metricLabel: 'D', score: 1 },
      { metricKey: 'I', metricLabel: 'I', score: 2 },
      { metricKey: 'S', metricLabel: 'S', score: 1 },
      { metricKey: 'C', metricLabel: 'C', score: 0 },
    ],
  },
  {
    id: 502,
    submissionId: 9002,
    participantId: 102,
    participantName: 'Raka Mahendra',
    testType: 'iq',
    submittedAt: '2026-03-09T11:30:00.000Z',
    scoreTotal: 114,
    scoreBand: 'above_average',
    primaryType: null,
    secondaryType: null,
    profileCode: null,
    interpretationKey: 'iq_above_average',
    resultPayload: {
      participantId: 102,
      correctAnswers: 4,
      totalQuestions: 6,
      answeredQuestions: 6,
      accuracyPercentage: 66.67,
      scoreTotal: 114,
      scoreBand: 'above_average',
    },
    summaries: [
      { metricKey: 'correct_answers', metricLabel: 'Correct Answers', score: 4 },
      { metricKey: 'accuracy_percentage', metricLabel: 'Accuracy Percentage', score: 66.67, band: 'above_average' },
    ],
  },
];

export function listResults() {
  return results;
}

export function getResultById(id: number) {
  return results.find((result) => result.id === id) ?? null;
}

export function storeResult(input: {
  submissionId: number;
  participantId: number;
  participantName: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoredResult: ScoredAssessmentResult;
}) {
  const existingResultIndex = results.findIndex((result) => result.submissionId === input.submissionId);
  const record: StoredResultRecord = {
    id: existingResultIndex >= 0 ? results[existingResultIndex].id : Date.now(),
    submissionId: input.submissionId,
    participantId: input.participantId,
    participantName: input.participantName,
    testType: input.testType,
    submittedAt: input.submittedAt,
    scoreTotal: input.scoredResult.scoreTotal,
    scoreBand: input.scoredResult.scoreBand,
    primaryType: input.scoredResult.primaryType,
    secondaryType: input.scoredResult.secondaryType,
    profileCode: input.scoredResult.profileCode,
    interpretationKey: input.scoredResult.interpretationKey,
    resultPayload: input.scoredResult.payload,
    summaries: input.scoredResult.summaries,
  };

  if (existingResultIndex >= 0) {
    results[existingResultIndex] = record;
  } else {
    results.unshift(record);
  }

  return record;
}
