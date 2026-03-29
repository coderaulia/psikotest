import { HttpError } from '../../lib/http-error.js';
import { findCustomerById } from '../site-auth/site-auth.repository.js';
import { fetchCustomerWorkspaceResults } from './site-results.repository.js';

export async function listCustomerWorkspaceResults(customerAccountId: number) {
  const account = await findCustomerById(customerAccountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  const items = await fetchCustomerWorkspaceResults(customerAccountId);

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
