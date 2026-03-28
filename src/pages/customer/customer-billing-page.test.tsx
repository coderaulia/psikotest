import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { renderWithRoute } from '@/test/render';

import { CustomerBillingPage } from './customer-billing-page';

const getCustomerBillingOverviewMock = vi.fn();
const updateCustomerSubscriptionMock = vi.fn();

vi.mock('@/services/customer-billing', () => ({
  getCustomerBillingOverview: (...args: unknown[]) => getCustomerBillingOverviewMock(...args),
  updateCustomerSubscription: (...args: unknown[]) => updateCustomerSubscriptionMock(...args),
}));

const baseOverview = {
  account: {
    id: 31,
    fullName: 'Workspace Owner',
    email: 'owner@example.com',
    accountType: 'business' as const,
    organizationName: 'Vanaila Talent Lab',
  },
  subscription: {
    id: 101,
    customerAccountId: 31,
    planCode: 'starter' as const,
    status: 'trial' as const,
    billingCycle: 'monthly' as const,
    assessmentLimit: 3,
    participantLimit: 5,
    teamMemberLimit: 3,
    startedAt: '2026-03-28T08:00:00.000Z',
    trialEndsAt: '2026-04-11T08:00:00.000Z',
    renewsAt: null,
    planLabel: 'Starter',
    planDescription: 'For teams validating the first assessment workflow.',
  },
  usage: {
    activeAssessmentCount: 1,
    participantRecordCount: 2,
    teamSeatCount: 1,
    remainingAssessmentSlots: 2,
    remainingParticipantSlots: 3,
    remainingTeamSeats: 2,
  },
  plans: [
    {
      planCode: 'starter' as const,
      label: 'Starter',
      description: 'For teams validating the first assessment workflow.',
      assessmentLimit: 3,
      participantLimit: 5,
      teamMemberLimit: 3,
    },
    {
      planCode: 'growth' as const,
      label: 'Growth',
      description: 'For active teams managing multiple assessments.',
      assessmentLimit: 20,
      participantLimit: 500,
      teamMemberLimit: 15,
    },
    {
      planCode: 'research' as const,
      label: 'Research',
      description: 'For research workspaces with larger participant volume.',
      assessmentLimit: 30,
      participantLimit: 2500,
      teamMemberLimit: 20,
    },
  ],
};

describe('CustomerBillingPage', () => {
  beforeEach(() => {
    getCustomerBillingOverviewMock.mockReset();
    updateCustomerSubscriptionMock.mockReset();
  });

  it('loads billing overview and updates the dummy plan selection', async () => {
    const updatedOverview = {
      ...baseOverview,
      subscription: {
        ...baseOverview.subscription,
        planCode: 'growth' as const,
        planLabel: 'Growth',
        planDescription: 'For active teams managing multiple assessments.',
        assessmentLimit: 20,
        participantLimit: 500,
        teamMemberLimit: 15,
      },
      usage: {
        ...baseOverview.usage,
        remainingAssessmentSlots: 19,
        remainingParticipantSlots: 498,
        remainingTeamSeats: 14,
      },
    };

    getCustomerBillingOverviewMock.mockResolvedValue(baseOverview);
    updateCustomerSubscriptionMock.mockResolvedValue(updatedOverview);

    renderWithRoute(<CustomerBillingPage />, {
      route: '/workspace/billing',
      path: '/workspace/billing',
    });

    const user = userEvent.setup();

    await screen.findByText('Control plan limits before you scale participant sharing');
    expect(screen.getAllByText('Starter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 / 3').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Growth.*500 participant records/i }));
    await user.click(screen.getByRole('button', { name: /save workspace plan/i }));

    expect(updateCustomerSubscriptionMock).toHaveBeenCalledWith({
      selectedPlan: 'growth',
      billingCycle: 'monthly',
    });
    expect(await screen.findByText(/dummy subscription updated/i)).toBeInTheDocument();
  });
});
