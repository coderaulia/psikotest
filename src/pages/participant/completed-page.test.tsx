import { screen } from '@testing-library/react';

import { renderWithRoute } from '@/test/render';
import { ParticipantCompletedPage } from './completed-page';

describe('ParticipantCompletedPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('hides detailed results until a review-required report is released', async () => {
    window.sessionStorage.setItem(
      'psikotest:participant:disc-public-001',
      JSON.stringify({
        submissionId: 1,
        participantId: 2,
        token: 'disc-public-001',
        submissionAccessToken: 'submission-token',
        testType: 'disc',
        participantResultMode: 'review_required',
        participant: {
          fullName: 'Participant 01',
          email: 'participant01@example.com',
          consentAccepted: true,
          consentAcceptedAt: new Date().toISOString(),
        },
        result: {
          id: 99,
          submissionId: 1,
          participantId: 2,
          participantName: 'Participant 01',
          participantEmail: 'participant01@example.com',
          department: null,
          positionTitle: null,
          sessionId: 10,
          sessionTitle: 'Graduate Hiring Batch',
          accessToken: 'disc-public-001',
          testType: 'disc',
          submittedAt: new Date().toISOString(),
          scoreTotal: null,
          scoreBand: null,
          primaryType: null,
          secondaryType: null,
          profileCode: null,
          interpretationKey: null,
          reviewStatus: 'reviewed',
          reviewStartedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedByAdminId: 1,
          reviewerAdminId: 1,
          releasedAt: null,
          releasedByAdminId: null,
          professionalSummary: 'Reviewed summary waiting release.',
          recommendation: null,
          limitations: null,
          reviewerNotes: null,
          resultPayload: {
            reviewStatus: 'reviewed',
            note: 'Your responses have been reviewed and are awaiting formal release.',
          },
          summaries: [],
        },
      }),
    );

    renderWithRoute(<ParticipantCompletedPage />, {
      route: '/t/disc-public-001/completed',
      path: '/t/:token/completed',
    });

    expect(await screen.findByText('Professional review required')).toBeInTheDocument();
    expect(screen.queryByText(/primary result/i)).not.toBeInTheDocument();
    expect(screen.getByText(/awaiting authorized release/i)).toBeInTheDocument();
  });

  it('shows detailed results after release', async () => {
    window.sessionStorage.setItem(
      'psikotest:participant:disc-public-001',
      JSON.stringify({
        submissionId: 1,
        participantId: 2,
        token: 'disc-public-001',
        submissionAccessToken: 'submission-token',
        testType: 'disc',
        participantResultMode: 'review_required',
        participant: {
          fullName: 'Participant 01',
          email: 'participant01@example.com',
          consentAccepted: true,
          consentAcceptedAt: new Date().toISOString(),
        },
        result: {
          id: 99,
          submissionId: 1,
          participantId: 2,
          participantName: 'Participant 01',
          participantEmail: 'participant01@example.com',
          department: null,
          positionTitle: null,
          sessionId: 10,
          sessionTitle: 'Graduate Hiring Batch',
          accessToken: 'disc-public-001',
          testType: 'disc',
          submittedAt: new Date().toISOString(),
          scoreTotal: 0,
          scoreBand: null,
          primaryType: 'I',
          secondaryType: 'D',
          profileCode: 'I/D',
          interpretationKey: 'disc_profile',
          reviewStatus: 'released',
          reviewStartedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedByAdminId: 1,
          reviewerAdminId: 1,
          releasedAt: new Date().toISOString(),
          releasedByAdminId: 1,
          professionalSummary: 'Strongly persuasive and proactive profile.',
          recommendation: 'Suitable for collaborative leadership roles.',
          limitations: 'Interpret with other assessment inputs.',
          reviewerNotes: null,
          resultPayload: {
            reviewStatus: 'released',
          },
          summaries: [{ metricKey: 'I', metricLabel: 'Influence', score: 10, band: null }],
        },
      }),
    );

    renderWithRoute(<ParticipantCompletedPage />, {
      route: '/t/disc-public-001/completed',
      path: '/t/:token/completed',
    });

    expect(await screen.findByText(/primary result/i)).toBeInTheDocument();
    expect(screen.getByText('Strongly persuasive and proactive profile.')).toBeInTheDocument();
    expect(screen.getByText('Suitable for collaborative leadership roles.')).toBeInTheDocument();
  });
});

