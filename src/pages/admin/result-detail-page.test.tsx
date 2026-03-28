import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { ResultDetailPage } from './result-detail-page';

const fetchResultDetailMock = vi.fn();
const fetchReviewerOptionsMock = vi.fn();
const assignAdminResultReviewerMock = vi.fn();
const updateAdminResultReviewMock = vi.fn();

vi.mock('@/services/admin-data', () => ({
  fetchResultDetail: (...args: unknown[]) => fetchResultDetailMock(...args),
  fetchReviewerOptions: (...args: unknown[]) => fetchReviewerOptionsMock(...args),
  assignAdminResultReviewer: (...args: unknown[]) => assignAdminResultReviewerMock(...args),
  updateAdminResultReview: (...args: unknown[]) => updateAdminResultReviewMock(...args),
}));

function buildResult(overrides: Record<string, unknown> = {}) {
  return {
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
    reviewStatus: 'scored_preliminary',
    reviewStartedAt: null,
    reviewedAt: null,
    reviewedByAdminId: null,
    reviewerAdminId: null,
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
    participant: {
      id: 12,
      fullName: 'Nadia Pratama',
      email: 'nadia@example.com',
      employeeCode: 'EMP-001',
      department: 'People Ops',
      positionTitle: 'Recruiter',
    },
    session: {
      id: 4,
      title: 'DISC Hiring Session',
      accessToken: 'disc-batch-a',
      testType: 'disc',
    },
    ...overrides,
  };
}

describe('ResultDetailPage', () => {
  beforeEach(() => {
    fetchResultDetailMock.mockReset();
    fetchReviewerOptionsMock.mockReset();
    assignAdminResultReviewerMock.mockReset();
    updateAdminResultReviewMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('lets super admins assign a reviewer and shows the visibility controls', async () => {
    window.sessionStorage.setItem(
      'psikotest:admin-session',
      JSON.stringify({
        token: 'admin-token',
        admin: {
          id: 1,
          fullName: 'Platform Owner',
          email: 'owner@example.com',
          role: 'super_admin',
        },
      }),
    );

    fetchResultDetailMock.mockResolvedValue(buildResult());
    fetchReviewerOptionsMock.mockResolvedValue([
      { id: 1, fullName: 'Platform Owner', email: 'owner@example.com', role: 'super_admin' },
      { id: 9, fullName: 'Dr. Reviewer', email: 'reviewer@example.com', role: 'psychologist_reviewer' },
    ]);
    assignAdminResultReviewerMock.mockResolvedValue(buildResult({ reviewerAdminId: 9, reviewStatus: 'in_review', reviewStartedAt: new Date().toISOString() }));

    renderWithRoute(<ResultDetailPage />, {
      route: '/admin/results/7',
      path: '/admin/results/:id',
    });

    expect(await screen.findByText('Nadia Pratama')).toBeInTheDocument();
    expect(screen.getByText(/full report with consent/i)).toBeInTheDocument();
    expect(screen.getByText(/protected progressive/i)).toBeInTheDocument();
    expect(screen.getByText(/participants cannot access the full report until the reviewer releases the final version/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/assigned reviewer/i), '9');
    await user.click(screen.getByRole('button', { name: /save assignment/i }));

    expect(assignAdminResultReviewerMock).toHaveBeenCalledWith(7, 9);
    expect(await screen.findByText('Dr. Reviewer (Psychologist reviewer)')).toBeInTheDocument();
  });
});
