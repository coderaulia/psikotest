import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerOnboardingPage } from './customer-onboarding-page';

const createCustomerAssessmentMock = vi.fn();

vi.mock('@/services/customer-onboarding', () => ({
  createCustomerAssessment: (...args: unknown[]) => createCustomerAssessmentMock(...args),
}));

describe('CustomerOnboardingPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    createCustomerAssessmentMock.mockReset();
    saveCustomerSession({
      token: 'customer-token',
      account: {
        id: 10,
        fullName: 'Research Owner',
        email: 'owner@example.com',
        accountType: 'researcher',
        organizationName: 'Psych Lab',
      },
    });
  });

  it('walks through the onboarding wizard and renders the generated participant link', async () => {
    createCustomerAssessmentMock.mockResolvedValue({
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
    });

    renderWithRoute(<CustomerOnboardingPage />, {
      route: '/workspace/create',
      path: '/workspace/create',
    });

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/assessment name/i), 'Study Pilot A');
    await user.clear(screen.getByLabelText(/organization name/i));
    await user.type(screen.getByLabelText(/organization name/i), 'Psych Lab');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.clear(screen.getByLabelText(/time limit/i));
    await user.type(screen.getByLabelText(/time limit/i), '18');
    await user.clear(screen.getByLabelText(/number of participants/i));
    await user.type(screen.getByLabelText(/number of participants/i), '60');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /generate participant link/i }));

    await screen.findByText(/draft link is ready/i);

    expect(createCustomerAssessmentMock).toHaveBeenCalledWith({
      testType: 'custom',
      title: 'Study Pilot A',
      purpose: 'research',
      organizationName: 'Psych Lab',
      administrationMode: 'remote_unsupervised',
      timeLimitMinutes: 18,
      participantLimit: 60,
      resultVisibility: 'participant_summary',
    });
    expect(screen.getByText('https://app.example.com/t/custom-study-pilot')).toBeInTheDocument();
  });
});
