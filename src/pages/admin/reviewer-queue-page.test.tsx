import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { ReviewerQueuePage } from './reviewer-queue-page';

const fetchReviewerQueueMock = vi.fn();
const fetchReviewerQueueSummaryMock = vi.fn();

vi.mock('@/services/admin-data', () => ({
  fetchReviewerQueue: (...args: unknown[]) => fetchReviewerQueueMock(...args),
  fetchReviewerQueueSummary: (...args: unknown[]) => fetchReviewerQueueSummaryMock(...args),
}));

describe('ReviewerQueuePage', () => {
  beforeEach(() => {
    fetchReviewerQueueMock.mockReset();
    fetchReviewerQueueSummaryMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('loads reviewer queue items for reviewer roles', async () => {
    window.sessionStorage.setItem(
      'psikotest:admin-session',
      JSON.stringify({
        token: 'admin-token',
        admin: {
          id: 1,
          fullName: 'Reviewer Admin',
          email: 'reviewer@example.com',
          role: 'psychologist_reviewer',
        },
      }),
    );

    fetchReviewerQueueSummaryMock.mockResolvedValue({
      pendingCount: 3,
      unassignedCount: 1,
      assignedToMeCount: 2,
      inReviewCount: 1,
      readyForReleaseCount: 1,
    });

    fetchReviewerQueueMock.mockResolvedValue([
      {
        id: 7,
        submissionId: 11,
        participantId: 12,
        participantName: 'Nadia Pratama',
        participantEmail: 'nadia@example.com',
        department: 'People Ops',
        positionTitle: 'Recruiter',
        sessionId: 4,
        sessionTitle: 'DISC Hiring Session',
        accessToken: 'disc-batch-a',
        testType: 'disc',
        submittedAt: new Date().toISOString(),
        scoreTotal: 0,
        scoreBand: null,
        primaryType: 'I',
        secondaryType: 'D',
        profileCode: 'I/D',
        interpretationKey: 'disc_profile',
        reviewStatus: 'in_review',
        reviewStartedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedByAdminId: null,
        reviewerAdminId: 1,
        releasedAt: null,
        releasedByAdminId: null,
        professionalSummary: null,
        recommendation: null,
        limitations: null,
        reviewerNotes: null,
        resultPayload: {},
        summaries: [],
      },
    ]);

    renderWithRoute(<ReviewerQueuePage />, {
      route: '/admin/reviewer-queue',
      path: '/admin/reviewer-queue',
    });

    expect(await screen.findByText('Nadia Pratama')).toBeInTheDocument();
    expect(screen.getByText('DISC Hiring Session')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open review/i })).toHaveAttribute('href', '/admin/results/7');
  });
});
