import type {
  CreateCustomerAssessmentParticipantPayload,
  CreateCustomerAssessmentPayload,
  CustomerAssessmentCheckoutPayload,
  CustomerAssessmentBulkInviteResponse,
  CustomerAssessmentDetail,
  CustomerAssessmentItem,
  CustomerAssessmentParticipantListResponse,
  CustomerAssessmentParticipantItem,
  SendCustomerAssessmentBulkInvitePayload,
  SendCustomerAssessmentParticipantInvitePayload,
  UpdateCustomerAssessmentPayload,
} from '@/types/assessment';

import { customerFetchJson } from './customer-api';

export async function listCustomerAssessments() {
  const payload = await customerFetchJson<{ items: CustomerAssessmentItem[] }>('/site-onboarding/assessments');
  return payload.items;
}

export async function getCustomerAssessment(assessmentId: number) {
  return customerFetchJson<CustomerAssessmentDetail>(`/site-onboarding/assessments/${assessmentId}`);
}

export async function createCustomerAssessment(payload: CreateCustomerAssessmentPayload) {
  return customerFetchJson<CustomerAssessmentItem>('/site-onboarding/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomerAssessment(assessmentId: number, payload: UpdateCustomerAssessmentPayload) {
  return customerFetchJson<CustomerAssessmentDetail>(`/site-onboarding/assessments/${assessmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function activateCustomerAssessment(assessmentId: number) {
  return customerFetchJson<CustomerAssessmentDetail>(`/site-onboarding/assessments/${assessmentId}/activate`, {
    method: 'POST',
  });
}

export async function completeCustomerAssessmentCheckout(assessmentId: number, payload: CustomerAssessmentCheckoutPayload) {
  return customerFetchJson<CustomerAssessmentDetail>(`/site-onboarding/assessments/${assessmentId}/checkout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listCustomerAssessmentParticipants(assessmentId: number) {
  return customerFetchJson<CustomerAssessmentParticipantListResponse>(`/site-onboarding/assessments/${assessmentId}/participants`);
}

export async function createCustomerAssessmentParticipant(assessmentId: number, payload: CreateCustomerAssessmentParticipantPayload) {
  return customerFetchJson<CustomerAssessmentParticipantItem>(`/site-onboarding/assessments/${assessmentId}/participants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendCustomerAssessmentParticipantInvite(
  assessmentId: number,
  participantId: number,
  payload: SendCustomerAssessmentParticipantInvitePayload,
) {
  return customerFetchJson<{
    participant: CustomerAssessmentParticipantItem;
    shareLink: string;
    deliveryPreview: string;
  }>(`/site-onboarding/assessments/${assessmentId}/participants/${participantId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendCustomerAssessmentBulkInvites(
  assessmentId: number,
  payload: SendCustomerAssessmentBulkInvitePayload,
) {
  return customerFetchJson<CustomerAssessmentBulkInviteResponse>(`/site-onboarding/assessments/${assessmentId}/participants/send-bulk`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
