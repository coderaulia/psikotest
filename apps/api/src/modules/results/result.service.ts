import { HttpError } from '../../lib/http-error.js';
import { listReviewerAdmins } from '../auth/auth.repository.js';
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
export type ReviewerQueueScope = 'all' | 'mine' | 'unassigned';
export type ReviewerAdminRole = 'super_admin' | 'psychologist_reviewer';

export interface ReviewActorSession {
  adminId: number;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
}

export interface ResultListFilters {
  search?: string;
  testType?: PublicTestTypeCode;
  dateFrom?: string;
  dateTo?: string;
  reviewStatus?: ResultReviewStatus;
  limit?: number;
}

export interface ReviewerAdminOption {
  id: number;
  fullName: string;
  email: string;
  role: ReviewerAdminRole;
}

export interface ReviewerQueueSummary {
  pendingCount: number;
  unassignedCount: number;
  assignedToMeCount: number;
  inReviewCount: number;
  readyForReleaseCount: number;
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
  reviewerAdminId?: number | null;
  professionalSummary?: string | null;
  recommendation?: string | null;
  limitations?: string | null;
  reviewerNotes?: string | null;
}

function isReviewerRole(role: ReviewActorSession['role']) {
  return role === 'super_admin' || role === 'psychologist_reviewer';
}

function canManageReviewerAssignments(role: ReviewActorSession['role']) {
  return role === 'super_admin' || role === 'admin';
}

function filterReviewerQueueItems(
  items: StoredResultRecord[],
  session: ReviewActorSession,
  scope: ReviewerQueueScope,
) {
  const visibleItems = session.role === 'super_admin'
    ? items
    : items.filter((item) => item.reviewerAdminId === null || item.reviewerAdminId === session.adminId);

  if (scope === 'mine') {
    return visibleItems.filter((item) => item.reviewerAdminId === session.adminId);
  }

  if (scope === 'unassigned') {
    return visibleItems.filter((item) => item.reviewerAdminId === null);
  }

  return visibleItems;
}

export async function listResults(filters: ResultListFilters = {}) {
  return fetchResults(filters);
}

export async function listReviewerQueue(session: ReviewActorSession, scope: ReviewerQueueScope = 'all', limit?: number) {
  if (!isReviewerRole(session.role)) {
    throw new HttpError(403, 'Reviewer access is required');
  }

  const items = await fetchReviewerQueueRecords(limit);
  return filterReviewerQueueItems(items, session, scope);
}

export async function getReviewerQueueSummary(session: ReviewActorSession) {
  const items = await listReviewerQueue(session, 'all', 200);

  return {
    pendingCount: items.length,
    unassignedCount: items.filter((item) => item.reviewerAdminId === null).length,
    assignedToMeCount: items.filter((item) => item.reviewerAdminId === session.adminId).length,
    inReviewCount: items.filter((item) => item.reviewStatus === 'in_review').length,
    readyForReleaseCount: items.filter((item) => item.reviewStatus === 'reviewed').length,
  } satisfies ReviewerQueueSummary;
}

export async function listReviewerOptions() {
  const rows = await listReviewerAdmins();

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role === 'psychologist_reviewer' ? 'psychologist_reviewer' : 'super_admin',
  })) satisfies ReviewerAdminOption[];
}

export async function getResultById(id: number) {
  return fetchResultById(id);
}

export async function assignResultReviewer(
  id: number,
  reviewerAdminId: number | null,
  session: ReviewActorSession,
) {
  const current = await fetchResultById(id);

  if (!current) {
    return null;
  }

  if (current.reviewStatus === 'released') {
    throw new HttpError(409, 'Released results cannot be reassigned');
  }

  if (session.role === 'psychologist_reviewer') {
    if (reviewerAdminId !== session.adminId) {
      throw new HttpError(403, 'Psychologist reviewers can only claim results for themselves');
    }

    if (current.reviewerAdminId !== null && current.reviewerAdminId !== session.adminId) {
      throw new HttpError(403, 'This result is already assigned to another reviewer');
    }
  } else if (!canManageReviewerAssignments(session.role)) {
    throw new HttpError(403, 'Reviewer assignment access is required');
  }

  if (reviewerAdminId !== null) {
    const reviewerOptions = await listReviewerOptions();
    if (!reviewerOptions.some((item) => item.id === reviewerAdminId)) {
      throw new HttpError(400, 'Reviewer not found');
    }
  }

  const nextStatus = reviewerAdminId !== null && current.reviewStatus === 'scored_preliminary'
    ? 'in_review'
    : undefined;

  return saveResultReviewRecord(id, {
    reviewerAdminId,
    reviewStatus: nextStatus,
  }, session.adminId);
}

export async function updateResultReview(
  id: number,
  input: ResultReviewUpdateInput,
  session: ReviewActorSession,
) {
  if (!isReviewerRole(session.role)) {
    throw new HttpError(403, 'Reviewer access is required');
  }

  const current = await fetchResultById(id);

  if (!current) {
    return null;
  }

  if (session.role === 'psychologist_reviewer' && current.reviewerAdminId !== null && current.reviewerAdminId !== session.adminId) {
    throw new HttpError(403, 'This result is assigned to another reviewer');
  }

  const nextInput: ResultReviewUpdateInput = {
    ...input,
  };

  if (session.role === 'psychologist_reviewer' && current.reviewerAdminId === null) {
    nextInput.reviewerAdminId = session.adminId;
  }

  return saveResultReviewRecord(id, nextInput, session.adminId);
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
