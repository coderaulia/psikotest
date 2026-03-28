import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { CustomerAssessmentDetailPage } from './customer-assessment-detail-page';

const getCustomerAssessmentMock = vi.fn();

vi.mock('@/services/customer-onboarding', () => ({
  getCustomerAssessment: (...args: unknown[]) => getCustomerAssessmentMock(...args),
}));

describe('CustomerAssessmentDetailPage', () => {
  beforeEach(() => {
    getCustomerAssessmentMock.mockReset();
  });

  it('loads a draft assessment and routes the customer into setup and dummy checkout', async () => {
    getCustomerAssessmentMock.mockResolvedValue({
      assessmentId: 51,
      sessionId: 81,
      title: 'Study Pilot A',
      organizationName: 'Psych Lab',
      testType: 'custom',
      assessmentPurpose: 'research',
      administrationMode: 'remote_unsupervised',
      resultVisibility: 'participant_summary',
      distributionPolicy: 'full_report_with_consent',
      protectedDeliveryMode: true,
      participantResultAccess: 'full_released',
      hrResultAccess: 'full',
      timeLimitMinutes: 18,
      participantLimit: 60,
      sessionStatus: 'draft',
      planStatus: 'trial',
      participantLink: 'https://app.example.com/t/custom-study-pilot',
      previewDemoLink: 'https://app.example.com/t/research-scale-pilot',
      createdAt: new Date().toISOString(),
      description: 'Draft CUSTOM assessment for Psych Lab (research).',
      instructions: ['Read carefully', 'Use the full scale'],
      consentStatement: 'I agree to participate in this research assessment.',
      privacyStatement: 'Responses are stored as confidential research data.',
      contactPerson: 'Research coordinator',
      interpretationMode: 'professional_review',
      canActivateSharing: true,
    });

    renderWithRoute(<CustomerAssessmentDetailPage />, {
      route: '/workspace/assessments/51',
      path: '/workspace/assessments/:assessmentId',
    });

    await screen.findByText('Study Pilot A');
    expect(screen.getAllByText(/full report with consent/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/protected delivery/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/reviewer notes and draft interpretations remain internal/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit assessment setup/i })).toHaveAttribute('href', '/workspace/assessments/51/setup');
    expect(screen.getByRole('link', { name: /continue to dummy payment/i })).toHaveAttribute('href', '/workspace/assessments/51/checkout');
  });
});
