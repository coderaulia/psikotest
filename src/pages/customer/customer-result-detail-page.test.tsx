import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerResultDetailPage } from './customer-result-detail-page';

const getCustomerWorkspaceResultDetailMock = vi.fn();

vi.mock('@/services/customer-results', async () => {
  const actual = await vi.importActual<typeof import('@/services/customer-results')>('@/services/customer-results');
  return {
    ...actual,
    getCustomerWorkspaceResultDetail: (...args: unknown[]) => getCustomerWorkspaceResultDetailMock(...args),
  };
});

describe('CustomerResultDetailPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCustomerWorkspaceResultDetailMock.mockReset();

    saveCustomerSession({
      token: 'customer-token',
      account: {
        id: 44,
        fullName: 'Workspace Owner',
        email: 'owner@example.com',
        accountType: 'business',
        organizationName: 'Vanaila Labs',
        workspaceRole: 'owner',
        sessionSource: 'owner',
        workspaceMemberId: null,
      },
    });
  });

  it('shows only the released customer-safe report narrative and score metrics', async () => {
    getCustomerWorkspaceResultDetailMock.mockResolvedValue({
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
      releasedRecommendation: 'Proceed to structured interview.',
      releasedLimitations: 'Interpret together with interview evidence.',
      visibilityNote: 'The released report can now be shared according to the configured access policy.',
      metrics: [
        { metricKey: 'D', metricLabel: 'Dominance', score: 8, band: 'Primary' },
      ],
    });

    renderWithRoute(<CustomerResultDetailPage />, {
      route: '/workspace/results/71',
      path: '/workspace/results/:resultId',
    });

    expect(await screen.findByRole('heading', { name: 'Nadia Pratama' })).toBeInTheDocument();
    expect(screen.getByText(/released summary for hiring decision support/i)).toBeInTheDocument();
    expect(screen.getByText(/proceed to structured interview/i)).toBeInTheDocument();
    expect(screen.getByText(/dominance/i)).toBeInTheDocument();
  });
});

