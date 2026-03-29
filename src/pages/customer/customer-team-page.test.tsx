import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerTeamPage } from './customer-team-page';

const getCustomerWorkspaceTeamMock = vi.fn();
const createCustomerWorkspaceMemberMock = vi.fn();
const sendCustomerWorkspaceMemberInviteMock = vi.fn();

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

describe('CustomerTeamPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
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

  it('adds teammates and surfaces activation links for invited workspace members', async () => {
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


