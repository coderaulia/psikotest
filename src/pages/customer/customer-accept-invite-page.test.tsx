import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { loadCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerAcceptInvitePage } from './customer-accept-invite-page';

const getWorkspaceInvitePreviewMock = vi.fn();
const acceptWorkspaceInviteMock = vi.fn();

vi.mock('@/services/customer-auth', () => ({
  getWorkspaceInvitePreview: (...args: unknown[]) => getWorkspaceInvitePreviewMock(...args),
  acceptWorkspaceInvite: (...args: unknown[]) => acceptWorkspaceInviteMock(...args),
}));

describe('CustomerAcceptInvitePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getWorkspaceInvitePreviewMock.mockReset();
    acceptWorkspaceInviteMock.mockReset();
  });

  it('activates a workspace invite and stores the shared workspace session', async () => {
    getWorkspaceInvitePreviewMock.mockResolvedValue({
      invite: {
        organizationName: 'Vanaila Research Lab',
        accountType: 'researcher',
        fullName: 'Review Analyst',
        email: 'reviewer@example.com',
        role: 'reviewer',
        expiresAt: '2026-03-31T14:30:00.000Z',
        isExpired: false,
      },
    });

    acceptWorkspaceInviteMock.mockResolvedValue({
      token: 'member-token',
      account: {
        id: 31,
        fullName: 'Review Analyst',
        email: 'reviewer@example.com',
        accountType: 'researcher',
        organizationName: 'Vanaila Research Lab',
        workspaceRole: 'reviewer',
        sessionSource: 'workspace_member',
        workspaceMemberId: 22,
      },
    });

    renderWithRoute(<CustomerAcceptInvitePage />, {
      route: '/accept-workspace-invite/example-token',
      path: '/accept-workspace-invite/:token',
      nextPath: '/workspace',
      nextElement: <div>Workspace home</div>,
    });

    const user = userEvent.setup();

    await screen.findByText('Vanaila Research Lab');
    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), 'Review Analyst');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPassword123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /activate workspace access/i }));

    await waitFor(() => {
      expect(acceptWorkspaceInviteMock).toHaveBeenCalledWith('example-token', {
        fullName: 'Review Analyst',
        password: 'StrongPassword123!',
      });
    });

    expect(loadCustomerSession()).toMatchObject({
      token: 'member-token',
      account: {
        email: 'reviewer@example.com',
        sessionSource: 'workspace_member',
      },
    });
  });
});


