import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';
import {
  fetchResultById,
  fetchResults,
  updateResultReviewStatusRecord,
  upsertResultRecord,
} from './result.repository.js';

export type ResultReviewStatus = 'preliminary' | 'reviewed';

export interface ResultListFilters {
  search?: string;
  testType?: PublicTestTypeCode;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface StoredResultRecord {
  id: number;
  submissionId: number;
  participantId: number;
  participantName: string;
  participantEmail: string;
  department: string | null;
  positionTitle: string | null;
  sessionId: number;
  sessionTitle: string;
  accessToken: string;
  testType: PublicTestTypeCode;
  submittedAt: string;
  scoreTotal: number | null;
  scoreBand: string | null;
  primaryType: string | null;
  secondaryType: string | null;
  profileCode: string | null;
  interpretationKey: string | null;
  reviewStatus: ResultReviewStatus;
  reviewedAt: string | null;
  reviewedByAdminId: number | null;
  resultPayload: Record<string, unknown>;
  summaries: ResultSummaryItem[];
}

export interface StoredResultDetailRecord extends StoredResultRecord {
  participant: {
    id: number;
    fullName: string;
    email: string;
    employeeCode: string | null;
    department: string | null;
    positionTitle: string | null;
  };
  session: {
    id: number;
    title: string;
    accessToken: string;
    testType: PublicTestTypeCode;
  };
}

export async function listResults(filters: ResultListFilters = {}) {
  return fetchResults(filters);
}

export async function getResultById(id: number) {
  return fetchResultById(id);
}

export async function updateResultReviewStatus(id: number, reviewStatus: ResultReviewStatus, adminId: number) {
  return updateResultReviewStatusRecord(id, reviewStatus, adminId);
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
