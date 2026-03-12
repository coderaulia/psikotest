import { screen } from '@testing-library/react';

import { renderWithRoute } from '@/test/render';
import { ParticipantCompletedPage } from './completed-page';

describe('ParticipantCompletedPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('hides detailed results when professional review is still required', async () => {
    window.sessionStorage.setItem(
      'psikotest:participant:disc-batch-a',
      JSON.stringify({
        submissionId: 1,
        participantId: 2,
        token: 'disc-batch-a',
        submissionAccessToken: 'submission-token',
        testType: 'disc',
        participantResultMode: 'review_required',
        participant: {
          fullName: 'Nadia Pratama',
          email: 'nadia@example.com',
          consentAccepted: true,
          consentAcceptedAt: new Date().toISOString(),
        },
        result: {
          id: 99,
          submissionId: 1,
          participantId: 2,
          participantName: 'Nadia Pratama',
          participantEmail: 'nadia@example.com',
          department: null,
          positionTitle: null,
          sessionId: 10,
          sessionTitle: 'Graduate Hiring Batch',
          accessToken: 'disc-batch-a',
          testType: 'disc',
          submittedAt: new Date().toISOString(),
          scoreTotal: null,
          scoreBand: null,
          primaryType: null,
          secondaryType: null,
          profileCode: null,
          interpretationKey: null,
          reviewStatus: 'preliminary',
          reviewedAt: null,
          reviewedByAdminId: null,
          resultPayload: {
            reviewStatus: 'preliminary',
            note: 'Your responses have been recorded. Final interpretation will be available after professional review.',
          },
          summaries: [],
        },
      }),
    );

    renderWithRoute(<ParticipantCompletedPage />, {
      route: '/t/disc-batch-a/completed',
      path: '/t/:token/completed',
    });

    expect(await screen.findByText('Professional review required')).toBeInTheDocument();
    expect(screen.queryByText(/primary result/i)).not.toBeInTheDocument();
    expect(screen.getByText(/final interpretation will be available after an authorized reviewer/i)).toBeInTheDocument();
  });
});
