import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';
import {
  fetchResultById,
  fetchResults,
  upsertResultRecord,
} from './result.repository.js';

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

export async function listResults() {
  return fetchResults();
}

export async function getResultById(id: number) {
  return fetchResultById(id);
}

export async function storeResult(input: {
  submissionId: number;
  participantId: number;
  participantName: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoredResult: ScoredAssessmentResult;
}) {
  const result = await upsertResultRecord(input);

  if (!result) {
    throw new Error('Failed to store result');
  }

  return result;
}
