import { HttpError } from '../../lib/http-error.js';
import { listReviewerAdmins } from '../auth/auth.repository.js';
import { fetchResultById, fetchResults, fetchReviewerQueueRecords, saveResultReviewRecord, upsertResultRecord, } from './result.repository.js';
function isReviewerRole(role) {
    return role === 'super_admin' || role === 'psychologist_reviewer';
}
function canManageReviewerAssignments(role) {
    return role === 'super_admin' || role === 'admin';
}
function filterReviewerQueueItems(items, session, scope) {
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
export async function listResults(filters = {}) {
    return fetchResults(filters);
}
export async function listReviewerQueue(session, scope = 'all', limit) {
    if (!isReviewerRole(session.role)) {
        throw new HttpError(403, 'Reviewer access is required');
    }
    const items = await fetchReviewerQueueRecords(limit);
    return filterReviewerQueueItems(items, session, scope);
}
export async function getReviewerQueueSummary(session) {
    const items = await listReviewerQueue(session, 'all', 200);
    return {
        pendingCount: items.length,
        unassignedCount: items.filter((item) => item.reviewerAdminId === null).length,
        assignedToMeCount: items.filter((item) => item.reviewerAdminId === session.adminId).length,
        inReviewCount: items.filter((item) => item.reviewStatus === 'in_review').length,
        readyForReleaseCount: items.filter((item) => item.reviewStatus === 'reviewed').length,
    };
}
export async function listReviewerOptions() {
    const rows = await listReviewerAdmins();
    return rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role === 'psychologist_reviewer' ? 'psychologist_reviewer' : 'super_admin',
    }));
}
export async function getResultById(id) {
    return fetchResultById(id);
}
export async function assignResultReviewer(id, reviewerAdminId, session) {
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
    }
    else if (!canManageReviewerAssignments(session.role)) {
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
export async function updateResultReview(id, input, session) {
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
    const nextInput = {
        ...input,
    };
    if (session.role === 'psychologist_reviewer' && current.reviewerAdminId === null) {
        nextInput.reviewerAdminId = session.adminId;
    }
    return saveResultReviewRecord(id, nextInput, session.adminId);
}
export async function storeResult(input) {
    const result = await upsertResultRecord(input);
    if (!result) {
        throw new Error('Failed to store result');
    }
    return result;
}
