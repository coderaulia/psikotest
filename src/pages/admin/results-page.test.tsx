import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { ResultsPage } from './results-page';

const fetchResultsMock = vi.fn();

vi.mock('@/services/admin-data', () => ({
  fetchResults: (...args: unknown[]) => fetchResultsMock(...args),
}));

describe('ResultsPage', () => {
  beforeEach(() => {
    fetchResultsMock.mockReset();
  });

  it('renders policy and audience visibility indicators for each result row', async () => {
    fetchResultsMock.mockResolvedValue([
      {
        id: 18,
        submissionId: 32,
        participantId: 11,
        participantName: 'Raka Mahendra',
        participantEmail: 'raka@example.com',
        department: 'Operations',
        positionTitle: 'Supervisor',
        sessionId: 7,
        sessionTitle: 'Operations Screening',
        accessToken: 'ops-screening',
        testType: 'iq',
        submittedAt: new Date().toISOString(),
        scoreTotal: 112,
        scoreBand: 'above_average',
        primaryType: null,
        secondaryType: null,
        profileCode: null,
        interpretationKey: 'iq_above_average',
        reviewStatus: 'reviewed',
        reviewStartedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedByAdminId: 4,
        reviewerAdminId: 4,
        releasedAt: null,
        releasedByAdminId: null,
        professionalSummary: null,
        recommendation: null,
        limitations: null,
        reviewerNotes: null,
        distributionPolicy: 'full_report_with_consent',
        participantResultAccess: 'full_released',
        hrResultAccess: 'full',
        protectedDeliveryMode: true,
        resultPayload: {},
        summaries: [],
      },
    ]);

    renderWithRoute(<ResultsPage />, {
      route: '/admin/results',
      path: '/admin/results',
    });

    expect(await screen.findByText('Raka Mahendra')).toBeInTheDocument();
    expect(screen.getByText(/full report with consent/i)).toBeInTheDocument();
    expect(screen.getByText(/protected delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/participant: full released/i)).toBeInTheDocument();
    expect(screen.getByText(/hr: full/i)).toBeInTheDocument();
  });
});
