import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { CustomerAssessmentDetailPage } from './customer-assessment-detail-page';

const getCustomerAssessmentMock = vi.fn();
const activateCustomerAssessmentMock = vi.fn();

vi.mock('@/services/customer-onboarding', () => ({
  getCustomerAssessment: (...args: unknown[]) => getCustomerAssessmentMock(...args),
  activateCustomerAssessment: (...args: unknown[]) => activateCustomerAssessmentMock(...args),
}));

describe('CustomerAssessmentDetailPage', () => {
  beforeEach(() => {
    getCustomerAssessmentMock.mockReset();
    activateCustomerAssessmentMock.mockReset();
  });

  it('loads a draft assessment and activates sharing', async () => {
    getCustomerAssessmentMock.mockResolvedValue({
      assessmentId: 51,
      sessionId: 81,
      title: 'Study Pilot A',
      organizationName: 'Psych Lab',
      testType: 'custom',
      assessmentPurpose: 'research',
      administrationMode: 'remote_unsupervised',
      resultVisibility: 'participant_summary',
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
      interpretationMode: 'self_assessment',
      canActivateSharing: true,
    });
    activateCustomerAssessmentMock.mockResolvedValue({
      assessmentId: 51,
      sessionId: 81,
      title: 'Study Pilot A',
      organizationName: 'Psych Lab',
      testType: 'custom',
      assessmentPurpose: 'research',
      administrationMode: 'remote_unsupervised',
      resultVisibility: 'participant_summary',
      timeLimitMinutes: 18,
      participantLimit: 60,
      sessionStatus: 'active',
      planStatus: 'upgraded',
      participantLink: 'https://app.example.com/t/custom-study-pilot',
      previewDemoLink: 'https://app.example.com/t/research-scale-pilot',
      createdAt: new Date().toISOString(),
      description: 'Draft CUSTOM assessment for Psych Lab (research).',
      instructions: ['Read carefully', 'Use the full scale'],
      consentStatement: 'I agree to participate in this research assessment.',
      privacyStatement: 'Responses are stored as confidential research data.',
      contactPerson: 'Research coordinator',
      interpretationMode: 'self_assessment',
      canActivateSharing: false,
    });

    renderWithRoute(<CustomerAssessmentDetailPage />, {
      route: '/workspace/assessments/51',
      path: '/workspace/assessments/:assessmentId',
    });

    await screen.findByText('Study Pilot A');
    expect(screen.getByText('Draft CUSTOM assessment for Psych Lab (research).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade to share/i })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /upgrade to share/i }));

    await screen.findByText(/participant sharing is now active/i);

    expect(activateCustomerAssessmentMock).toHaveBeenCalledWith(51);
    expect(screen.getByRole('button', { name: /copy live participant link/i })).toBeInTheDocument();
  });
});
