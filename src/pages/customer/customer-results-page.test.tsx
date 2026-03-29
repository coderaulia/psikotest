import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerResultsPage } from './customer-results-page';

const getCustomerWorkspaceResultsMock = vi.fn();

vi.mock('@/services/customer-results', () => ({
  getCustomerWorkspaceResults: (...args: unknown[]) => getCustomerWorkspaceResultsMock(...args),
}));

describe('CustomerResultsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCustomerWorkspaceResultsMock.mockReset();

    saveCustomerSession({
      token: 'customer-token',
      account: {
        id: 44,
        fullName: 'Workspace Owner',
        email: 'owner@example.com',
        accountType: 'business',
        organizationName: 'Vanaila Labs',
      },
    });
  });

  it('shows released summaries while hiding reviewer drafts from the customer workspace', async () => {
    getCustomerWorkspaceResultsMock.mockResolvedValue({
      summary: {
        total: 2,
        released: 1,
        awaitingReview: 1,
        hiddenDrafts: 1,
      },
      items: [
        {
          resultId: 71,
          assessmentId: 52,
          assessmentTitle: 'Graduate Hiring Batch A',
          participantName: 'Nadia Pratama',
          participantEmail: 'nadia@example.com',
          testType: 'disc',
          submittedAt: '2026-03-28T10:00:00.000Z',
          scoreTotal: null,
          scoreBand: null,
          profileCode: 'I/D',
          reviewStatus: 'released',
          distributionPolicy: 'full_report_with_consent',
          participantResultAccess: 'full_released',
          hrResultAccess: 'full',
          protectedDeliveryMode: true,
          releasedSummary: 'Released summary for hiring decision support.',
          visibilityNote: 'The released report can now be shared according to the configured access policy.',
        },
        {
          resultId: 72,
          assessmentId: 53,
          assessmentTitle: 'Leadership Screening',
          participantName: 'Raka Mahendra',
          participantEmail: 'raka@example.com',
          testType: 'iq',
          submittedAt: '2026-03-28T12:30:00.000Z',
          scoreTotal: 112,
          scoreBand: 'Above average',
          profileCode: null,
          reviewStatus: 'in_review',
          distributionPolicy: 'participant_summary',
          participantResultAccess: 'summary',
          hrResultAccess: 'full',
          protectedDeliveryMode: false,
          releasedSummary: null,
          visibilityNote: 'Reviewer draft content is hidden until the report is released.',
        },
      ],
    });

    renderWithRoute(<CustomerResultsPage />, {
      route: '/workspace/results',
      path: '/workspace/results',
    });

    expect(await screen.findByText('Nadia Pratama')).toBeInTheDocument();
    expect(screen.getByText(/released professional summary/i)).toBeInTheDocument();
    expect(screen.getByText(/released summary for hiring decision support/i)).toBeInTheDocument();
    expect(screen.getByText(/internal review still protected/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewer draft content is hidden until the report is released/i)).toBeInTheDocument();
  });
});
