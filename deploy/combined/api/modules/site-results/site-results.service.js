import { HttpError } from '../../lib/http-error.js';
import { findCustomerById } from '../site-auth/site-auth.repository.js';
import { recordWorkspaceUsageMetric } from '../site-billing/site-billing.service.js';
import { fetchCustomerWorkspaceResultDetail, fetchCustomerWorkspaceResults, } from './site-results.repository.js';
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const normalized = String(value).replace(/"/g, '""');
    return /[",\r\n]/.test(normalized) ? `"${normalized}"` : normalized;
}
async function requireActiveCustomer(customerAccountId) {
    const account = await findCustomerById(customerAccountId);
    if (!account || account.status !== 'active') {
        throw new HttpError(401, 'Customer account is not active');
    }
    return account;
}
async function loadWorkspaceResultItems(customerAccountId) {
    await requireActiveCustomer(customerAccountId);
    return fetchCustomerWorkspaceResults(customerAccountId);
}
function buildCsvRows(items) {
    const columns = [
        'assessment_title',
        'participant_name',
        'participant_email',
        'test_type',
        'submitted_at',
        'review_status',
        'distribution_policy',
        'participant_access',
        'hr_access',
        'score_total',
        'score_band',
        'profile_code',
        'released_summary',
        'visibility_note',
    ];
    const rows = items.map((item) => [
        item.assessmentTitle,
        item.participantName,
        item.participantEmail,
        item.testType,
        item.submittedAt,
        item.reviewStatus,
        item.distributionPolicy,
        item.participantResultAccess,
        item.hrResultAccess,
        item.scoreTotal,
        item.scoreBand,
        item.profileCode,
        item.releasedSummary,
        item.visibilityNote,
    ]);
    return [columns, ...rows]
        .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
        .join('\n');
}
export async function listCustomerWorkspaceResults(customerAccountId) {
    const items = await loadWorkspaceResultItems(customerAccountId);
    return {
        summary: {
            total: items.length,
            released: items.filter((item) => item.reviewStatus === 'released').length,
            awaitingReview: items.filter((item) => item.reviewStatus === 'reviewed' || item.reviewStatus === 'in_review').length,
            hiddenDrafts: items.filter((item) => item.reviewStatus !== 'released').length,
        },
        items,
    };
}
export async function getCustomerWorkspaceResultDetail(customerAccountId, resultId) {
    await requireActiveCustomer(customerAccountId);
    const detail = await fetchCustomerWorkspaceResultDetail(customerAccountId, resultId);
    if (!detail) {
        throw new HttpError(404, 'Workspace result not found');
    }
    return detail;
}
export async function exportCustomerWorkspaceResultsCsv(customerAccountId) {
    const items = await loadWorkspaceResultItems(customerAccountId);
    await recordWorkspaceUsageMetric({
        customerAccountId,
        metricKey: 'result_exported',
        referenceType: 'customer_workspace_results',
        referenceId: null,
        metadata: {
            exportedCount: items.length,
            format: 'csv',
        },
    });
    return buildCsvRows(items);
}
