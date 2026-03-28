import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findCustomerById } from '../site-auth/site-auth.repository.js';
import {
  fetchWorkspaceSubscription,
  fetchWorkspaceUsage,
  insertWorkspaceSubscription,
  updateWorkspaceSubscription,
  type WorkspaceBillingCycle,
  type WorkspacePlanCode,
  type WorkspaceSubscriptionStatus,
} from './site-billing.repository.js';

export type DummyCheckoutPlan = WorkspacePlanCode;
export type DummyCheckoutBillingCycle = WorkspaceBillingCycle;

const workspacePlanCatalog = {
  starter: {
    label: 'Starter',
    description: 'For teams validating the first assessment workflow.',
    assessmentLimit: 3,
    participantLimit: 5,
    teamMemberLimit: 3,
  },
  growth: {
    label: 'Growth',
    description: 'For active business workspaces managing multiple assessments.',
    assessmentLimit: 20,
    participantLimit: 500,
    teamMemberLimit: 15,
  },
  research: {
    label: 'Research',
    description: 'For academic and psychology research workspaces with larger response volume.',
    assessmentLimit: 30,
    participantLimit: 2500,
    teamMemberLimit: 20,
  },
} as const;

function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function addBillingCycle(cycle: WorkspaceBillingCycle) {
  return addDays(cycle === 'annual' ? 365 : 30);
}

function mapAccount(record: {
  id: number;
  full_name: string;
  email: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
}) {
  return {
    id: record.id,
    fullName: record.full_name,
    email: record.email,
    accountType: record.account_type,
    organizationName: record.organization_name,
  };
}

async function requireActiveCustomer(accountId: number) {
  const account = await findCustomerById(accountId);

  if (!account || account.status !== 'active') {
    throw new HttpError(401, 'Customer account is not active');
  }

  return account;
}

function getDefaultPlanCode(accountType: 'business' | 'researcher') {
  return accountType === 'researcher' ? 'research' : 'starter';
}

function buildPlanLimits(planCode: WorkspacePlanCode) {
  const plan = workspacePlanCatalog[planCode];
  return {
    assessmentLimit: plan.assessmentLimit,
    participantLimit: plan.participantLimit,
    teamMemberLimit: plan.teamMemberLimit,
  };
}

function buildSubscriptionPayload(input: {
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  billingCycle: WorkspaceBillingCycle;
}) {
  const limits = buildPlanLimits(input.planCode);

  return {
    customerAccountId: input.customerAccountId,
    planCode: input.planCode,
    status: input.status,
    billingCycle: input.billingCycle,
    assessmentLimit: limits.assessmentLimit,
    participantLimit: limits.participantLimit,
    teamMemberLimit: limits.teamMemberLimit,
    trialEndsAt: input.status === 'trial' ? addDays(14) : null,
    renewsAt: input.status === 'active' ? addBillingCycle(input.billingCycle) : null,
  };
}

async function ensureWorkspaceSubscription(account: {
  id: number;
  account_type: 'business' | 'researcher';
}) {
  const existing = await fetchWorkspaceSubscription(account.id);
  if (existing) {
    return existing;
  }

  const created = await insertWorkspaceSubscription(
    buildSubscriptionPayload({
      customerAccountId: account.id,
      planCode: getDefaultPlanCode(account.account_type),
      status: 'trial',
      billingCycle: 'monthly',
    }),
  );

  if (!created) {
    throw new HttpError(500, 'Workspace subscription could not be initialized');
  }

  return created;
}

function buildUsageSummary(input: {
  activeAssessmentCount: number;
  participantRecordCount: number;
  teamSeatCount: number;
  assessmentLimit: number;
  participantLimit: number;
  teamMemberLimit: number;
}) {
  return {
    activeAssessmentCount: input.activeAssessmentCount,
    participantRecordCount: input.participantRecordCount,
    teamSeatCount: input.teamSeatCount,
    remainingAssessmentSlots: Math.max(input.assessmentLimit - input.activeAssessmentCount, 0),
    remainingParticipantSlots: Math.max(input.participantLimit - input.participantRecordCount, 0),
    remainingTeamSeats: Math.max(input.teamMemberLimit - input.teamSeatCount, 0),
  };
}

export async function getWorkspaceBillingOverview(customerAccountId: number) {
  const account = await requireActiveCustomer(customerAccountId);
  const subscription = await ensureWorkspaceSubscription(account);
  const usage = await fetchWorkspaceUsage(customerAccountId);

  return {
    account: mapAccount(account),
    subscription: {
      ...subscription,
      planLabel: workspacePlanCatalog[subscription.planCode].label,
      planDescription: workspacePlanCatalog[subscription.planCode].description,
    },
    usage: buildUsageSummary({
      ...usage,
      assessmentLimit: subscription.assessmentLimit,
      participantLimit: subscription.participantLimit,
      teamMemberLimit: subscription.teamMemberLimit,
    }),
    plans: (Object.entries(workspacePlanCatalog) as Array<[WorkspacePlanCode, typeof workspacePlanCatalog[WorkspacePlanCode]]>).map(([planCode, plan]) => ({
      planCode,
      label: plan.label,
      description: plan.description,
      assessmentLimit: plan.assessmentLimit,
      participantLimit: plan.participantLimit,
      teamMemberLimit: plan.teamMemberLimit,
    })),
  };
}

export async function updateWorkspaceSubscriptionSelection(input: {
  customerAccountId: number;
  planCode: WorkspacePlanCode;
  billingCycle: WorkspaceBillingCycle;
}) {
  const account = await requireActiveCustomer(input.customerAccountId);
  const existing = await ensureWorkspaceSubscription(account);
  const updated = await updateWorkspaceSubscription(
    buildSubscriptionPayload({
      customerAccountId: input.customerAccountId,
      planCode: input.planCode,
      status: 'active',
      billingCycle: input.billingCycle,
    }),
  );

  if (!updated) {
    throw new HttpError(500, 'Workspace subscription could not be updated');
  }

  await createAuditEvent({
    actorType: 'system',
    entityType: 'workspace_subscription',
    entityId: updated.id,
    action: 'workspace_subscription.updated',
    metadata: {
      customerAccountId: input.customerAccountId,
      previousPlanCode: existing.planCode,
      nextPlanCode: updated.planCode,
      previousStatus: existing.status,
      nextStatus: updated.status,
      billingCycle: updated.billingCycle,
      dummyMode: true,
    },
  });

  return getWorkspaceBillingOverview(input.customerAccountId);
}

async function getCapacityState(customerAccountId: number) {
  const overview = await getWorkspaceBillingOverview(customerAccountId);
  return {
    subscription: overview.subscription,
    usage: overview.usage,
  };
}

export async function assertAssessmentCreationCapacity(customerAccountId: number) {
  const { subscription, usage } = await getCapacityState(customerAccountId);

  if (usage.activeAssessmentCount >= subscription.assessmentLimit) {
    throw new HttpError(409, 'Assessment limit reached for this workspace plan');
  }
}

export async function assertParticipantCapacity(customerAccountId: number, additionalParticipants = 1) {
  const { subscription, usage } = await getCapacityState(customerAccountId);

  if (usage.participantRecordCount + additionalParticipants > subscription.participantLimit) {
    throw new HttpError(409, 'Participant limit reached for this workspace plan');
  }
}

export async function assertTeamMemberCapacity(customerAccountId: number, additionalSeats = 1) {
  const { subscription, usage } = await getCapacityState(customerAccountId);

  if (usage.teamSeatCount + additionalSeats > subscription.teamMemberLimit) {
    throw new HttpError(409, 'Team member limit reached for this workspace plan');
  }
}
