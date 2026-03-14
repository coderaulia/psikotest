import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoredAssessmentResult } from '../scoring/scoring.types.js';
import {
  fetchResultById,
  fetchResults,
  fetchReviewerQueueRecords,
  saveResultReviewRecord,
  upsertResultRecord,
} from './result.repository.js';

export type ResultReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';

export interface ResultListFilters {
  search?: string;
  testType?: PublicTestTypeCode;
  dateFrom?: string;
  dateTo?: string;
  reviewStatus?: ResultReviewStatus;
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
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: number | null;
  reviewerAdminId: number | null;
  releasedAt: string | null;
  releasedByAdminId: number | null;
  professionalSummary: string | null;
  recommendation: string | null;
  limitations: string | null;
  reviewerNotes: string | null;
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

export interface ResultReviewUpdateInput {
  reviewStatus?: ResultReviewStatus;
  professionalSummary?: string | null;
  recommendation?: string | null;
  limitations?: string | null;
  reviewerNotes?: string | null;
}

export async function listResults(filters: ResultListFilters = {}) {
  return fetchResults(filters);
}

export async function listReviewerQueue(limit?: number) {
  return fetchReviewerQueueRecords(limit);
}

export async function getResultById(id: number) {
  return fetchResultById(id);
}

export async function updateResultReview(id: number, input: ResultReviewUpdateInput, adminId: number) {
  return saveResultReviewRecord(id, input, adminId);
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
