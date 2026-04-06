import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { loadParticipantConsent } from '@/lib/participant-session';
import { renderWithRoute } from '@/test/render';
import { ParticipantConsentPage } from './consent-page';

const fetchPublicSessionMock = vi.fn();

vi.mock('@/services/public-sessions', () => ({
  fetchPublicSession: (...args: unknown[]) => fetchPublicSessionMock(...args),
}));

describe('ParticipantConsentPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchPublicSessionMock.mockReset();
  });

  it('requires consent before continuing to the identity page', async () => {
    fetchPublicSessionMock.mockResolvedValue({
      session: {
        id: 10,
        title: 'Graduate Hiring Batch',
        testType: 'disc',
        instructions: [],
        estimatedMinutes: 15,
        status: 'active',
        compliance: {
          assessmentPurpose: 'recruitment',
          administrationMode: 'remote_unsupervised',
          interpretationMode: 'professional_review',
          participantResultMode: 'review_required',
          consentStatement: 'I agree to participate for recruitment screening.',
          privacyStatement: 'Results will be visible only to authorized reviewers.',
          contactPerson: 'HR Assessment Desk',
        },
      },
      questions: [],
    });

    renderWithRoute(<ParticipantConsentPage />, {
      route: '/t/disc-public-001',
      path: '/t/:token',
      nextPath: '/t/:token/identity',
      nextElement: <div>Identity form</div>,
    });

    expect(await screen.findByText('Assessment consent')).toBeInTheDocument();
    const continueButton = screen.getByRole('button', { name: /continue to identity form/i });
    expect(continueButton).toBeDisabled();

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox'));
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    await screen.findByText('Identity form');
    await waitFor(() => {
      expect(loadParticipantConsent('disc-public-001')).not.toBeNull();
    });
  });
});

