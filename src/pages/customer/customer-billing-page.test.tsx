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
    activeAssessmentCount: 3,
    participantRecordCount: 4,
    teamSeatCount: 2,
    remainingAssessmentSlots: 0,
    remainingParticipantSlots: 1,
    remainingTeamSeats: 1,
  },
  diagnostics: [
    {
      resource: 'assessments' as const,
      label: 'Assessment capacity',
      current: 3,
      limit: 3,
      remaining: 0,
      utilizationPercent: 100,
      severity: 'limit_reached' as const,
      suggestedPlanCode: 'growth' as const,
      suggestedPlanLabel: 'Growth',
      message: 'Assessment capacity has reached the current plan limit. Upgrade to Growth to continue.',
    },
    {
      resource: 'participants' as const,
      label: 'Participant records',
      current: 4,
      limit: 5,
      remaining: 1,
      utilizationPercent: 80,
      severity: 'warning' as const,
      suggestedPlanCode: 'growth' as const,
      suggestedPlanLabel: 'Growth',
      message: 'Participant records is approaching the current plan limit.',
    },
    {
      resource: 'team_members' as const,
      label: 'Team seats',
      current: 2,
      limit: 3,
      remaining: 1,
      utilizationPercent: 67,
      severity: 'critical' as const,
      suggestedPlanCode: 'growth' as const,
      suggestedPlanLabel: 'Growth',
      message: 'Team seats is nearly full. Upgrade before the next operational step.',
    },
  ],
  upgradeGuidance: {
    isUpgradeRecommended: true,
    highestSeverity: 'limit_reached' as const,
    suggestedPlanCode: 'growth' as const,
    suggestedPlanLabel: 'Growth',
    reasons: [
      'Assessment capacity has reached the current plan limit. Upgrade to Growth to continue.',
      'Participant records is approaching the current plan limit.',
    ],
    isCurrentPlanSaturated: true,
    currentPlanCode: 'starter' as const,
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

  it('loads billing overview, shows upgrade guidance, and updates the dummy plan selection', async () => {
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
        remainingAssessmentSlots: 17,
        remainingParticipantSlots: 496,
        remainingTeamSeats: 13,
      },
      diagnostics: baseOverview.diagnostics.map((item) => ({
        ...item,
        severity: 'healthy' as const,
        suggestedPlanCode: null,
        suggestedPlanLabel: null,
        message: `${item.label} is within the current workspace plan.`,
      })),
      upgradeGuidance: {
        isUpgradeRecommended: false,
        highestSeverity: 'healthy' as const,
        suggestedPlanCode: null,
        suggestedPlanLabel: null,
        reasons: [],
        isCurrentPlanSaturated: false,
        currentPlanCode: 'growth' as const,
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
    expect(screen.getByText(/upgrade recommended: growth/i)).toBeInTheDocument();
    expect(screen.getAllByText(/assessment capacity has reached the current plan limit/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Growth.*500 participant records/i }));
    await user.click(screen.getByRole('button', { name: /save workspace plan/i }));

    expect(updateCustomerSubscriptionMock).toHaveBeenCalledWith({
      selectedPlan: 'growth',
      billingCycle: 'monthly',
    });
    expect(await screen.findByText(/dummy subscription updated/i)).toBeInTheDocument();
  });
});

