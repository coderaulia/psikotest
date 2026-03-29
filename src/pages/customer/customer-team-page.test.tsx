import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerTeamPage } from './customer-team-page';

const getCustomerBillingOverviewMock = vi.fn();
const getCustomerWorkspaceTeamMock = vi.fn();
const createCustomerWorkspaceMemberMock = vi.fn();
const sendCustomerWorkspaceMemberInviteMock = vi.fn();

vi.mock('@/services/customer-billing', () => ({
  getCustomerBillingOverview: (...args: unknown[]) => getCustomerBillingOverviewMock(...args),
}));

vi.mock('@/services/customer-workspace', () => ({
  getCustomerWorkspaceTeam: (...args: unknown[]) => getCustomerWorkspaceTeamMock(...args),
  createCustomerWorkspaceMember: (...args: unknown[]) => createCustomerWorkspaceMemberMock(...args),
  sendCustomerWorkspaceMemberInvite: (...args: unknown[]) => sendCustomerWorkspaceMemberInviteMock(...args),
}));

const baseTeam = {
  workspace: {
    organizationName: 'Vanaila Research Lab',
    ownerName: 'Workspace Owner',
    ownerEmail: 'owner@example.com',
    accountType: 'researcher' as const,
  },
  items: [
    {
      id: 9,
      fullName: 'Workspace Owner',
      email: 'owner@example.com',
      role: 'owner' as const,
      status: 'active' as const,
      source: 'owner' as const,
      invitedAt: null,
      lastNotifiedAt: null,
      activatedAt: null,
      activationExpiresAt: null,
      lastLoginAt: null,
    },
    {
      id: 22,
      fullName: 'Review Analyst',
      email: 'reviewer@example.com',
      role: 'reviewer' as const,
      status: 'invited' as const,
      source: 'workspace_member' as const,
      invitedAt: null,
      lastNotifiedAt: null,
      activatedAt: null,
      activationExpiresAt: '2026-03-31T14:30:00.000Z',
      lastLoginAt: null,
    },
  ],
};

const saturatedBillingOverview = {
  account: {
    id: 31,
    fullName: 'Workspace Owner',
    email: 'owner@example.com',
    accountType: 'researcher' as const,
    organizationName: 'Vanaila Research Lab',
    workspaceRole: 'owner' as const,
    sessionSource: 'owner' as const,
    workspaceMemberId: null,
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
    teamSeatCount: 3,
    remainingAssessmentSlots: 2,
    remainingParticipantSlots: 3,
    remainingTeamSeats: 0,
  },
  diagnostics: [
    {
      resource: 'assessments' as const,
      label: 'Assessment capacity',
      current: 1,
      limit: 3,
      remaining: 2,
      utilizationPercent: 33,
      severity: 'healthy' as const,
      suggestedPlanCode: null,
      suggestedPlanLabel: null,
      message: 'Assessment capacity is within the current workspace plan.',
    },
    {
      resource: 'participants' as const,
      label: 'Participant records',
      current: 2,
      limit: 5,
      remaining: 3,
      utilizationPercent: 40,
      severity: 'healthy' as const,
      suggestedPlanCode: null,
      suggestedPlanLabel: null,
      message: 'Participant records is within the current workspace plan.',
    },
    {
      resource: 'team_members' as const,
      label: 'Team seats',
      current: 3,
      limit: 3,
      remaining: 0,
      utilizationPercent: 100,
      severity: 'limit_reached' as const,
      suggestedPlanCode: 'growth' as const,
      suggestedPlanLabel: 'Growth',
      message: 'Team seats has reached the current plan limit. Upgrade to Growth to continue.',
    },
  ],
  upgradeGuidance: {
    isUpgradeRecommended: true,
    highestSeverity: 'limit_reached' as const,
    suggestedPlanCode: 'growth' as const,
    suggestedPlanLabel: 'Growth',
    reasons: ['Team seats has reached the current plan limit. Upgrade to Growth to continue.'],
    isCurrentPlanSaturated: true,
    currentPlanCode: 'starter' as const,
  },
  plans: [],
};

describe('CustomerTeamPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCustomerBillingOverviewMock.mockReset();
    getCustomerWorkspaceTeamMock.mockReset();
    createCustomerWorkspaceMemberMock.mockReset();
    sendCustomerWorkspaceMemberInviteMock.mockReset();

    saveCustomerSession({
      token: 'customer-token',
      account: {
        id: 31,
        fullName: 'Workspace Owner',
        email: 'owner@example.com',
        accountType: 'researcher',
        organizationName: 'Vanaila Research Lab',
        workspaceRole: 'owner',
        sessionSource: 'owner',
        workspaceMemberId: null,
      },
    });
  });

  it('blocks new teammates when seat capacity is full', async () => {
    getCustomerWorkspaceTeamMock.mockResolvedValue(baseTeam);
    getCustomerBillingOverviewMock.mockResolvedValue(saturatedBillingOverview);

    renderWithRoute(<CustomerTeamPage />, {
      route: '/workspace/team',
      path: '/workspace/team',
    });

    await screen.findByText('Workspace Owner');
    expect(screen.getByText(/team seats has reached the current plan limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add teammate/i })).toBeDisabled();
  });

  it('adds teammates and surfaces activation links for invited workspace members', async () => {
    const availableBillingOverview = {
      ...saturatedBillingOverview,
      usage: {
        ...saturatedBillingOverview.usage,
        teamSeatCount: 2,
        remainingTeamSeats: 1,
      },
      diagnostics: saturatedBillingOverview.diagnostics.map((item) =>
        item.resource === 'team_members'
          ? {
              ...item,
              current: 2,
              remaining: 1,
              utilizationPercent: 67,
              severity: 'warning' as const,
              message: 'Team seats is approaching the current plan limit.',
            }
          : item,
      ),
      upgradeGuidance: {
        ...saturatedBillingOverview.upgradeGuidance,
        highestSeverity: 'warning' as const,
      },
    };

    const expandedTeam = {
      ...baseTeam,
      items: [
        ...baseTeam.items,
        {
          id: 27,
          fullName: 'Ops Partner',
          email: 'ops@example.com',
          role: 'operator' as const,
          status: 'invited' as const,
          source: 'workspace_member' as const,
          invitedAt: null,
          lastNotifiedAt: null,
          activatedAt: null,
          activationExpiresAt: null,
          lastLoginAt: null,
        },
      ],
    };

    const invitedTeam = {
      ...expandedTeam,
      items: expandedTeam.items.map((item) =>
        item.id === 22
          ? {
              ...item,
              invitedAt: '2026-03-28T14:30:00.000Z',
              lastNotifiedAt: '2026-03-28T14:30:00.000Z',
              activationExpiresAt: '2026-03-31T14:30:00.000Z',
            }
          : item,
      ),
    };

    getCustomerWorkspaceTeamMock
      .mockResolvedValueOnce(baseTeam)
      .mockResolvedValueOnce(expandedTeam)
      .mockResolvedValueOnce(invitedTeam);
    getCustomerBillingOverviewMock
      .mockResolvedValueOnce(availableBillingOverview)
      .mockResolvedValueOnce(availableBillingOverview)
      .mockResolvedValueOnce(availableBillingOverview);

    createCustomerWorkspaceMemberMock.mockResolvedValue(expandedTeam.items[2]);
    sendCustomerWorkspaceMemberInviteMock.mockResolvedValue({
      member: invitedTeam.items[1],
      deliveryPreview: 'Activation link prepared for reviewer@example.com. It expires in 72 hours.',
      activationLink: 'https://psikotest.vanaila.com/accept-workspace-invite/example-token',
      loginLink: null,
      expiresAt: '2026-03-31T14:30:00.000Z',
    });

    renderWithRoute(<CustomerTeamPage />, {
      route: '/workspace/team',
      path: '/workspace/team',
    });

    const user = userEvent.setup();

    await screen.findByText('Workspace Owner');
    await user.type(screen.getByLabelText(/full name/i), 'Ops Partner');
    await user.type(screen.getByLabelText(/^email$/i), 'ops@example.com');
    await user.selectOptions(screen.getByLabelText(/role/i), 'operator');
    await user.click(screen.getByRole('button', { name: /add teammate/i }));

    await screen.findByText(/workspace team member added/i);
    expect(createCustomerWorkspaceMemberMock).toHaveBeenCalledWith({
      fullName: 'Ops Partner',
      email: 'ops@example.com',
      role: 'operator',
    });
    expect(await screen.findByText('Ops Partner')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /send activation link/i })[0]);

    expect(await screen.findAllByText(/activation link prepared/i)).toHaveLength(2);
    expect(sendCustomerWorkspaceMemberInviteMock).toHaveBeenCalledWith(22);
    expect(await screen.findByText(/accept-workspace-invite\/example-token/i)).toBeInTheDocument();
    expect(await screen.findByText(/activation expires/i)).toBeInTheDocument();
  }, 10000);
});
