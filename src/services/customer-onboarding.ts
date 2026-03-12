import type { CreateCustomerAssessmentPayload, CustomerAssessmentItem } from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function listCustomerAssessments() {
  const payload = await customerFetchJson<{ items: CustomerAssessmentItem[] }>('/site-onboarding/assessments');
  return payload.items;
}

export async function createCustomerAssessment(payload: CreateCustomerAssessmentPayload) {
  return customerFetchJson<CustomerAssessmentItem>('/site-onboarding/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
