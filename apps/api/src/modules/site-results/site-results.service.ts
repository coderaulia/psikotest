import { HttpError } from '../../lib/http-error.js';
import { findCustomerById } from '../site-auth/site-auth.repository.js';
import { fetchCustomerWorkspaceResults, type CustomerWorkspaceResultRecord } from './site-results.repository.js';

function escapeCsvValue(value: string | number | null) {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value).replace(/"/g, '""');
  return /[",\r\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

async function requireActiveCustomer(customerAccountId: number) {
  const account = await findCustomerById(customerAccountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  return account;
}

async function loadWorkspaceResultItems(customerAccountId: number) {
  await requireActiveCustomer(customerAccountId);
  return fetchCustomerWorkspaceResults(customerAccountId);
}

function buildCsvRows(items: CustomerWorkspaceResultRecord[]) {
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
    .map((row) => row.map((value) => escapeCsvValue(value as string | number | null)).join(','))
    .join('\n');
}

export async function listCustomerWorkspaceResults(customerAccountId: number) {
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

export async function exportCustomerWorkspaceResultsCsv(customerAccountId: number) {
  const items = await loadWorkspaceResultItems(customerAccountId);
  return buildCsvRows(items);
}
