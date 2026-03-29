import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { saveCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerAssessmentParticipantsPage } from './customer-assessment-participants-page';

const getCustomerBillingOverviewMock = vi.fn();
const getCustomerAssessmentMock = vi.fn();
const listCustomerAssessmentParticipantsMock = vi.fn();
const createCustomerAssessmentParticipantMock = vi.fn();
const importCustomerAssessmentParticipantsMock = vi.fn();
const sendCustomerAssessmentParticipantInviteMock = vi.fn();
const sendCustomerAssessmentParticipantReminderMock = vi.fn();
const sendCustomerAssessmentBulkInvitesMock = vi.fn();
const sendCustomerAssessmentBulkRemindersMock = vi.fn();

vi.mock('@/services/customer-billing', () => ({
  getCustomerBillingOverview: (...args: unknown[]) => getCustomerBillingOverviewMock(...args),
}));

vi.mock('@/services/customer-onboarding', () => ({
  getCustomerAssessment: (...args: unknown[]) => getCustomerAssessmentMock(...args),
  listCustomerAssessmentParticipants: (...args: unknown[]) => listCustomerAssessmentParticipantsMock(...args),
  createCustomerAssessmentParticipant: (...args: unknown[]) => createCustomerAssessmentParticipantMock(...args),
  importCustomerAssessmentParticipants: (...args: unknown[]) => importCustomerAssessmentParticipantsMock(...args),
  sendCustomerAssessmentParticipantInvite: (...args: unknown[]) => sendCustomerAssessmentParticipantInviteMock(...args),
  sendCustomerAssessmentParticipantReminder: (...args: unknown[]) => sendCustomerAssessmentParticipantReminderMock(...args),
  sendCustomerAssessmentBulkInvites: (...args: unknown[]) => sendCustomerAssessmentBulkInvitesMock(...args),
  sendCustomerAssessmentBulkReminders: (...args: unknown[]) => sendCustomerAssessmentBulkRemindersMock(...args),
}));

const detail = {
  assessmentId: 52,
  sessionId: 82,
  title: 'Graduate Hiring Batch A',
  organizationName: 'Vanaila Labs',
  testType: 'disc' as const,
  assessmentPurpose: 'recruitment' as const,
  administrationMode: 'remote_unsupervised' as const,
  resultVisibility: 'participant_summary' as const,
  distributionPolicy: 'participant_summary' as const,
  protectedDeliveryMode: false,
  participantResultAccess: 'summary' as const,
  hrResultAccess: 'full' as const,
  timeLimitMinutes: 20,
  participantLimit: 24,
  sessionStatus: 'active' as const,
  planStatus: 'upgraded' as const,
  participantLink: 'https://app.example.com/t/disc-hiring-a',
  previewDemoLink: 'https://app.example.com/t/disc-batch-a',
  createdAt: '2026-03-28T10:00:00.000Z',
  description: 'Hiring assessment',
  instructions: ['Read carefully', 'Answer honestly'],
  consentStatement: 'I agree.',
  privacyStatement: 'Private.',
  contactPerson: 'People Ops',
  interpretationMode: 'self_assessment' as const,
  canActivateSharing: false,
};

const participantList = {
  assessmentId: 52,
  shareLink: 'https://app.example.com/t/disc-hiring-a',
  summary: {
    total: 2,
    draft: 1,
    invited: 1,
    inProgress: 0,
    completed: 0,
  },
  items: [
    {
      id: 401,
      fullName: 'Nadia Pratama',
      email: 'nadia@example.com',
      employeeCode: 'EMP-001',
      department: 'People Ops',
      positionTitle: 'Recruiter',
      note: null,
      status: 'draft' as const,
      invitedVia: null,
      invitedAt: null,
      reminderCount: 0,
      lastReminderAt: null,
      lastSubmittedAt: null,
      submissionStatus: null,
      resultId: null,
    },
    {
      id: 402,
      fullName: 'Raka Mahendra',
      email: 'raka@example.com',
      employeeCode: 'EMP-002',
      department: 'Operations',
      positionTitle: 'Coordinator',
      note: 'Priority invite',
      status: 'invited' as const,
      invitedVia: 'email' as const,
      invitedAt: '2026-03-28T11:00:00.000Z',
      reminderCount: 1,
      lastReminderAt: '2026-03-28T12:30:00.000Z',
      lastSubmittedAt: null,
      submissionStatus: null,
      resultId: null,
    },
  ],
};

const billingOverview = {
  account: {
    id: 31,
    fullName: 'Workspace Owner',
    email: 'owner@example.com',
    accountType: 'business' as const,
    organizationName: 'Vanaila Labs',
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
    participantRecordCount: 5,
    teamSeatCount: 1,
    remainingAssessmentSlots: 2,
    remainingParticipantSlots: 0,
    remainingTeamSeats: 2,
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
      current: 5,
      limit: 5,
      remaining: 0,
      utilizationPercent: 100,
      severity: 'limit_reached' as const,
      suggestedPlanCode: 'growth' as const,
      suggestedPlanLabel: 'Growth',
      message: 'Participant records has reached the current plan limit. Upgrade to Growth to continue.',
    },
    {
      resource: 'team_members' as const,
      label: 'Team seats',
      current: 1,
      limit: 3,
      remaining: 2,
      utilizationPercent: 33,
      severity: 'healthy' as const,
      suggestedPlanCode: null,
      suggestedPlanLabel: null,
      message: 'Team seats is within the current workspace plan.',
    },
  ],
  upgradeGuidance: {
    isUpgradeRecommended: true,
    highestSeverity: 'limit_reached' as const,
    suggestedPlanCode: 'growth' as const,
    suggestedPlanLabel: 'Growth',
    reasons: ['Participant records has reached the current plan limit. Upgrade to Growth to continue.'],
    isCurrentPlanSaturated: true,
    currentPlanCode: 'starter' as const,
  },
  plans: [],
};

describe('CustomerAssessmentParticipantsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCustomerBillingOverviewMock.mockReset();
    getCustomerAssessmentMock.mockReset();
    listCustomerAssessmentParticipantsMock.mockReset();
    createCustomerAssessmentParticipantMock.mockReset();
    importCustomerAssessmentParticipantsMock.mockReset();
    sendCustomerAssessmentParticipantInviteMock.mockReset();
    sendCustomerAssessmentParticipantReminderMock.mockReset();
    sendCustomerAssessmentBulkInvitesMock.mockReset();
    sendCustomerAssessmentBulkRemindersMock.mockReset();

    saveCustomerSession({
      token: 'customer-token',
      account: {
        id: 31,
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

  it('shows billing pressure and blocks new participant additions when capacity is full', async () => {
    getCustomerAssessmentMock.mockResolvedValue(detail);
    listCustomerAssessmentParticipantsMock.mockResolvedValue(participantList);
    getCustomerBillingOverviewMock.mockResolvedValue(billingOverview);

    renderWithRoute(<CustomerAssessmentParticipantsPage />, {
      route: '/workspace/assessments/52/participants',
      path: '/workspace/assessments/:assessmentId/participants',
    });

    await screen.findByText('Nadia Pratama');
    expect(screen.getByText(/participant records has reached the current plan limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add participant/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /import participant list/i })).toBeDisabled();
  });

  it('sends pending invites in bulk from the assessment participant list', async () => {
    getCustomerAssessmentMock.mockResolvedValue(detail);
    listCustomerAssessmentParticipantsMock.mockResolvedValue({
      ...participantList,
      summary: { ...participantList.summary, draft: 1 },
    });
    getCustomerBillingOverviewMock.mockResolvedValue({
      ...billingOverview,
      usage: {
        ...billingOverview.usage,
        participantRecordCount: 2,
        remainingParticipantSlots: 3,
      },
      diagnostics: billingOverview.diagnostics.map((item) =>
        item.resource === 'participants'
          ? {
              ...item,
              current: 2,
              remaining: 3,
              utilizationPercent: 40,
              severity: 'healthy' as const,
              suggestedPlanCode: null,
              suggestedPlanLabel: null,
              message: 'Participant records is within the current workspace plan.',
            }
          : item,
      ),
      upgradeGuidance: {
        ...billingOverview.upgradeGuidance,
        isUpgradeRecommended: false,
        highestSeverity: 'healthy' as const,
        suggestedPlanCode: null,
        suggestedPlanLabel: null,
        reasons: [],
        isCurrentPlanSaturated: false,
      },
    });
    sendCustomerAssessmentBulkInvitesMock.mockResolvedValue({
      invitedCount: 1,
      skippedCount: 1,
      shareLink: participantList.shareLink,
      deliveryPreview: 'Dummy email invites queued for 1 participant(s). Share link: https://app.example.com/t/disc-hiring-a',
    });

    renderWithRoute(<CustomerAssessmentParticipantsPage />, {
      route: '/workspace/assessments/52/participants',
      path: '/workspace/assessments/:assessmentId/participants',
    });

    const user = userEvent.setup();

    await screen.findByText('Nadia Pratama');
    await user.click(screen.getByRole('button', { name: /invite draft emails/i }));

    expect(sendCustomerAssessmentBulkInvitesMock).toHaveBeenCalledWith(52, { channel: 'email' });
    expect(await screen.findByText(/dummy email invites queued for 1 participant/i)).toBeInTheDocument();
  });

  it('sends a reminder for invited participants', async () => {
    getCustomerAssessmentMock.mockResolvedValue(detail);
    listCustomerAssessmentParticipantsMock.mockResolvedValue(participantList);
    getCustomerBillingOverviewMock.mockResolvedValue({
      ...billingOverview,
      usage: {
        ...billingOverview.usage,
        participantRecordCount: 2,
        remainingParticipantSlots: 3,
      },
      diagnostics: billingOverview.diagnostics.map((item) =>
        item.resource === 'participants'
          ? {
              ...item,
              current: 2,
              remaining: 3,
              utilizationPercent: 40,
              severity: 'healthy' as const,
              suggestedPlanCode: null,
              suggestedPlanLabel: null,
              message: 'Participant records is within the current workspace plan.',
            }
          : item,
      ),
      upgradeGuidance: {
        ...billingOverview.upgradeGuidance,
        isUpgradeRecommended: false,
        highestSeverity: 'healthy' as const,
        suggestedPlanCode: null,
        suggestedPlanLabel: null,
        reasons: [],
        isCurrentPlanSaturated: false,
      },
    });
    sendCustomerAssessmentParticipantReminderMock.mockResolvedValue({
      participant: participantList.items[1],
      shareLink: participantList.shareLink,
      deliveryPreview: 'Dummy reminder queued for raka@example.com. Share link: https://app.example.com/t/disc-hiring-a',
    });

    renderWithRoute(<CustomerAssessmentParticipantsPage />, {
      route: '/workspace/assessments/52/participants',
      path: '/workspace/assessments/:assessmentId/participants',
    });

    const user = userEvent.setup();

    await screen.findByText('Raka Mahendra');
    const reminderButtons = screen.getAllByRole('button', { name: /^send reminder/i });
    await user.click(reminderButtons[1]!);

    expect(sendCustomerAssessmentParticipantReminderMock).toHaveBeenCalledWith(52, 402, { channel: 'email' });
    expect(await screen.findByText(/dummy reminder queued for raka@example.com/i)).toBeInTheDocument();
  });

  it('imports pasted participant rows before invite delivery', async () => {
    getCustomerAssessmentMock.mockResolvedValue(detail);
    listCustomerAssessmentParticipantsMock.mockResolvedValue(participantList);
    getCustomerBillingOverviewMock.mockResolvedValue({
      ...billingOverview,
      usage: {
        ...billingOverview.usage,
        participantRecordCount: 2,
        remainingParticipantSlots: 3,
      },
      diagnostics: billingOverview.diagnostics.map((item) =>
        item.resource === 'participants'
          ? {
              ...item,
              current: 2,
              remaining: 3,
              utilizationPercent: 40,
              severity: 'healthy' as const,
              suggestedPlanCode: null,
              suggestedPlanLabel: null,
              message: 'Participant records is within the current workspace plan.',
            }
          : item,
      ),
      upgradeGuidance: {
        ...billingOverview.upgradeGuidance,
        isUpgradeRecommended: false,
        highestSeverity: 'healthy' as const,
        suggestedPlanCode: null,
        suggestedPlanLabel: null,
        reasons: [],
        isCurrentPlanSaturated: false,
      },
    });
    importCustomerAssessmentParticipantsMock.mockResolvedValue({
      importedCount: 2,
      updatedCount: 0,
      totalRows: 2,
    });

    renderWithRoute(<CustomerAssessmentParticipantsPage />, {
      route: '/workspace/assessments/52/participants',
      path: '/workspace/assessments/:assessmentId/participants',
    });

    const user = userEvent.setup();

    await screen.findByText('Nadia Pratama');
    fireEvent.change(screen.getByPlaceholderText(/full name, email, employee code/i), {
      target: {
        value: 'Sinta Dewi, sinta@example.com, EMP-003, HR, Analyst, Shortlist\nBima Putra, bima@example.com, EMP-004, Ops, Lead, Priority',
      },
    });
    await user.click(screen.getByRole('button', { name: /import participant list/i }));

    expect(importCustomerAssessmentParticipantsMock).toHaveBeenCalledWith(52, {
      rows: [
        {
          fullName: 'Sinta Dewi',
          email: 'sinta@example.com',
          employeeCode: 'EMP-003',
          department: 'HR',
          positionTitle: 'Analyst',
          note: 'Shortlist',
        },
        {
          fullName: 'Bima Putra',
          email: 'bima@example.com',
          employeeCode: 'EMP-004',
          department: 'Ops',
          positionTitle: 'Lead',
          note: 'Priority',
        },
      ],
    });
    expect(await screen.findByText(/imported 2 participant\(s\) and updated 0 existing row/i)).toBeInTheDocument();
  });
});
