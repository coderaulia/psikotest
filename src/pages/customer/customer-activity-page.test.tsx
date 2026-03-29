import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerActivityPage } from './customer-activity-page';

const getCustomerWorkspaceActivityMock = vi.fn();

vi.mock('@/services/customer-workspace', async () => {
  const actual = await vi.importActual<typeof import('@/services/customer-workspace')>('@/services/customer-workspace');
  return {
    ...actual,
    getCustomerWorkspaceActivity: (...args: unknown[]) => getCustomerWorkspaceActivityMock(...args),
  };
});

describe('CustomerActivityPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCustomerWorkspaceActivityMock.mockReset();

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

  it('shows workspace activity items grouped by category', async () => {
    getCustomerWorkspaceActivityMock.mockResolvedValue({
      workspace: {
        organizationName: 'Vanaila Labs',
        accountType: 'business',
      },
      summary: {
        totalEvents: 3,
        assessmentEvents: 1,
        participantDeliveryEvents: 1,
        teamEvents: 1,
        billingEvents: 0,
      },
      items: [
        {
          id: 1,
          actorType: 'system',
          actorAdminId: null,
          actorName: null,
          entityType: 'customer_workspace_member',
          entityId: 81,
          action: 'customer_workspace.member_invited',
          category: 'team',
          label: 'Workspace invite prepared',
          description: 'Activation link prepared for reviewer@example.com.',
          metadata: { email: 'reviewer@example.com' },
          createdAt: '2026-03-29T03:00:00.000Z',
        },
        {
          id: 2,
          actorType: 'system',
          actorAdminId: null,
          actorName: null,
          entityType: 'customer_assessment_participant',
          entityId: 91,
          action: 'customer_assessment_participant.bulk_invited',
          category: 'participant_delivery',
          label: 'Bulk invitations prepared',
          description: '3 invites prepared via email.',
          metadata: { invitedCount: 3 },
          createdAt: '2026-03-29T02:00:00.000Z',
        },
        {
          id: 3,
          actorType: 'system',
          actorAdminId: null,
          actorName: null,
          entityType: 'customer_assessment',
          entityId: 55,
          action: 'customer_assessment.created',
          category: 'assessment',
          label: 'Assessment draft created',
          description: 'DISC draft created for Vanaila Labs.',
          metadata: { testType: 'disc' },
          createdAt: '2026-03-29T01:00:00.000Z',
        },
      ],
    });

    renderWithRoute(<CustomerActivityPage />, {
      route: '/workspace/activity',
      path: '/workspace/activity',
    });

    expect(await screen.findByText(/workspace invite prepared/i)).toBeInTheDocument();
    expect(screen.getByText(/bulk invitations prepared/i)).toBeInTheDocument();
    expect(screen.getByText(/assessment draft created/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

