import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { findCustomerById } from '../site-auth/site-auth.repository.js';
import { createBillingCheckoutSession, createBillingInvoice, fetchBillingCheckoutSessions, fetchBillingInvoices, fetchWorkspaceSubscription, fetchWorkspaceUsage, insertWorkspaceSubscription, recordWorkspaceUsageEvent, updateWorkspaceSubscription, upsertWorkspaceUsageSnapshot, } from './site-billing.repository.js';
const workspacePlanCatalog = {
    starter: {
        label: 'Starter',
        description: 'For teams validating the first assessment workflow.',
        assessmentLimit: 3,
        participantLimit: 5,
        teamMemberLimit: 3,
        monthlyPrice: 0,
        annualPrice: 0,
    },
    growth: {
        label: 'Growth',
        description: 'For active business workspaces managing multiple assessments.',
        assessmentLimit: 20,
        participantLimit: 500,
        teamMemberLimit: 15,
        monthlyPrice: 29,
        annualPrice: 290,
    },
    research: {
        label: 'Research',
        description: 'For academic and psychology research workspaces with larger response volume.',
        assessmentLimit: 30,
        participantLimit: 2500,
        teamMemberLimit: 20,
        monthlyPrice: 39,
        annualPrice: 390,
    },
};
const planOrder = ['starter', 'growth', 'research'];
function addDays(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString();
}
function addBillingCycle(cycle) {
    return addDays(cycle === 'annual' ? 365 : 30);
}
function mapAccount(record) {
    return {
        id: record.id,
        fullName: record.full_name,
        email: record.email,
        accountType: record.account_type,
        organizationName: record.organization_name,
    };
}
async function requireActiveCustomer(accountId) {
    const account = await findCustomerById(accountId);
    if (!account || account.status !== 'active') {
        throw new HttpError(401, 'Customer account is not active');
    }
    return account;
}
function getDefaultPlanCode(accountType) {
    return accountType === 'researcher' ? 'research' : 'starter';
}
function buildPlanLimits(planCode) {
    const plan = workspacePlanCatalog[planCode];
    return {
        assessmentLimit: plan.assessmentLimit,
        participantLimit: plan.participantLimit,
        teamMemberLimit: plan.teamMemberLimit,
    };
}
function buildSubscriptionPayload(input) {
    const limits = buildPlanLimits(input.planCode);
    const currentPeriodStart = input.status === 'active' ? new Date().toISOString() : null;
    const currentPeriodEnd = input.status === 'active' ? addBillingCycle(input.billingCycle) : null;
    return {
        customerAccountId: input.customerAccountId,
        planCode: input.planCode,
        status: input.status,
        billingCycle: input.billingCycle,
        billingProvider: input.billingProvider ?? 'dummy',
        providerCustomerId: input.providerCustomerId ?? null,
        providerSubscriptionId: input.providerSubscriptionId ?? null,
        providerPriceId: input.providerPriceId ?? null,
        assessmentLimit: limits.assessmentLimit,
        participantLimit: limits.participantLimit,
        teamMemberLimit: limits.teamMemberLimit,
        trialEndsAt: input.status === 'trial' ? addDays(14) : null,
        renewsAt: input.status === 'active' ? currentPeriodEnd : null,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
        canceledAt: input.canceledAt ?? null,
        pastDueAt: input.pastDueAt ?? null,
        suspendedAt: input.suspendedAt ?? null,
        planVersion: input.planVersion ?? 1,
        billingContactEmail: input.billingContactEmail ?? null,
    };
}
async function ensureWorkspaceSubscription(account) {
    const existing = await fetchWorkspaceSubscription(account.id);
    if (existing) {
        return existing;
    }
    const created = await insertWorkspaceSubscription(buildSubscriptionPayload({
        customerAccountId: account.id,
        planCode: getDefaultPlanCode(account.account_type),
        status: 'trial',
        billingCycle: 'monthly',
        billingContactEmail: account.email,
    }));
    if (!created) {
        throw new HttpError(500, 'Workspace subscription could not be initialized');
    }
    return created;
}
function buildUsageSummary(input) {
    return {
        activeAssessmentCount: input.activeAssessmentCount,
        participantRecordCount: input.participantRecordCount,
        teamSeatCount: input.teamSeatCount,
        remainingAssessmentSlots: Math.max(input.assessmentLimit - input.activeAssessmentCount, 0),
        remainingParticipantSlots: Math.max(input.participantLimit - input.participantRecordCount, 0),
        remainingTeamSeats: Math.max(input.teamMemberLimit - input.teamSeatCount, 0),
    };
}
function getUsageSeverity(current, limit) {
    if (current >= limit) {
        return 'limit_reached';
    }
    const utilizationRatio = current / Math.max(limit, 1);
    const remaining = limit - current;
    if (remaining <= 1 || utilizationRatio >= 0.9) {
        return 'critical';
    }
    if (utilizationRatio >= 0.7) {
        return 'warning';
    }
    return 'healthy';
}
function getNextPlanCode(currentPlanCode) {
    const currentIndex = planOrder.indexOf(currentPlanCode);
    return currentIndex >= 0 && currentIndex < planOrder.length - 1 ? planOrder[currentIndex + 1] : null;
}
function getPlanLimit(planCode, resource) {
    const plan = workspacePlanCatalog[planCode];
    switch (resource) {
        case 'assessments':
            return plan.assessmentLimit;
        case 'participants':
            return plan.participantLimit;
        case 'team_members':
            return plan.teamMemberLimit;
    }
}
function findSuggestedPlanCode(resource, currentValue, currentPlanCode) {
    for (const planCode of planOrder) {
        if (getPlanLimit(planCode, resource) > currentValue) {
            if (planOrder.indexOf(planCode) > planOrder.indexOf(currentPlanCode)) {
                return planCode;
            }
            break;
        }
    }
    return getNextPlanCode(currentPlanCode);
}
function buildUsageDiagnostic(input) {
    const remaining = Math.max(input.limit - input.current, 0);
    const utilizationPercent = Math.min(100, Math.round((input.current / Math.max(input.limit, 1)) * 100));
    const severity = getUsageSeverity(input.current, input.limit);
    const suggestedPlanCode = severity === 'healthy' ? null : findSuggestedPlanCode(input.resource, input.current, input.currentPlanCode);
    const suggestedPlanLabel = suggestedPlanCode ? workspacePlanCatalog[suggestedPlanCode].label : null;
    let message = `${input.label} is within the current workspace plan.`;
    if (severity === 'warning') {
        message = `${input.label} is approaching the current plan limit.`;
    }
    else if (severity === 'critical') {
        message = `${input.label} is nearly full. Upgrade before the next operational step.`;
    }
    else if (severity === 'limit_reached') {
        message = suggestedPlanLabel
            ? `${input.label} has reached the current plan limit. Upgrade to ${suggestedPlanLabel} to continue.`
            : `${input.label} has reached the highest bundled plan limit.`;
    }
    return {
        resource: input.resource,
        label: input.label,
        current: input.current,
        limit: input.limit,
        remaining,
        utilizationPercent,
        severity,
        suggestedPlanCode,
        suggestedPlanLabel,
        message,
    };
}
function getSeverityWeight(severity) {
    switch (severity) {
        case 'limit_reached':
            return 3;
        case 'critical':
            return 2;
        case 'warning':
            return 1;
        case 'healthy':
        default:
            return 0;
    }
}
function buildUpgradeGuidance(input) {
    const flaggedDiagnostics = input.diagnostics.filter((item) => item.severity !== 'healthy');
    const sortedDiagnostics = [...flaggedDiagnostics].sort((left, right) => getSeverityWeight(right.severity) - getSeverityWeight(left.severity));
    const suggestedPlanCode = sortedDiagnostics.reduce((selected, item) => {
        if (!item.suggestedPlanCode) {
            return selected;
        }
        if (!selected) {
            return item.suggestedPlanCode;
        }
        return planOrder.indexOf(item.suggestedPlanCode) > planOrder.indexOf(selected) ? item.suggestedPlanCode : selected;
    }, null);
    return {
        isUpgradeRecommended: sortedDiagnostics.length > 0,
        highestSeverity: sortedDiagnostics[0]?.severity ?? 'healthy',
        suggestedPlanCode,
        suggestedPlanLabel: suggestedPlanCode ? workspacePlanCatalog[suggestedPlanCode].label : null,
        reasons: sortedDiagnostics.map((item) => item.message),
        isCurrentPlanSaturated: sortedDiagnostics.some((item) => item.severity === 'limit_reached'),
        currentPlanCode: input.currentPlanCode,
    };
}
function getPlanPrice(planCode, billingCycle) {
    const plan = workspacePlanCatalog[planCode];
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
}
async function syncWorkspaceUsageSnapshot(customerAccountId, subscription) {
    if (!subscription) {
        return null;
    }
    const usage = await fetchWorkspaceUsage(customerAccountId);
    await upsertWorkspaceUsageSnapshot({
        customerAccountId,
        workspaceSubscriptionId: subscription.id,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        assessmentCount: usage.activeAssessmentCount,
        participantCount: usage.participantRecordCount,
        teamMemberCount: usage.teamSeatCount,
        exportCount: 0,
    });
    return usage;
}
export async function getWorkspaceBillingOverview(customerAccountId) {
    const account = await requireActiveCustomer(customerAccountId);
    const subscription = await ensureWorkspaceSubscription(account);
    const usage = (await syncWorkspaceUsageSnapshot(customerAccountId, subscription)) ?? (await fetchWorkspaceUsage(customerAccountId));
    const recentCheckoutSessions = await fetchBillingCheckoutSessions(customerAccountId, 5);
    const recentInvoices = await fetchBillingInvoices(customerAccountId, 10);
    const usageSummary = buildUsageSummary({
        ...usage,
        assessmentLimit: subscription.assessmentLimit,
        participantLimit: subscription.participantLimit,
        teamMemberLimit: subscription.teamMemberLimit,
    });
    const diagnostics = [
        buildUsageDiagnostic({
            resource: 'assessments',
            label: 'Assessment capacity',
            current: usage.activeAssessmentCount,
            limit: subscription.assessmentLimit,
            currentPlanCode: subscription.planCode,
        }),
        buildUsageDiagnostic({
            resource: 'participants',
            label: 'Participant records',
            current: usage.participantRecordCount,
            limit: subscription.participantLimit,
            currentPlanCode: subscription.planCode,
        }),
        buildUsageDiagnostic({
            resource: 'team_members',
            label: 'Team seats',
            current: usage.teamSeatCount,
            limit: subscription.teamMemberLimit,
            currentPlanCode: subscription.planCode,
        }),
    ];
    return {
        account: mapAccount(account),
        subscription: {
            ...subscription,
            planLabel: workspacePlanCatalog[subscription.planCode].label,
            planDescription: workspacePlanCatalog[subscription.planCode].description,
        },
        usage: usageSummary,
        diagnostics,
        upgradeGuidance: buildUpgradeGuidance({
            currentPlanCode: subscription.planCode,
            diagnostics,
        }),
        plans: Object.entries(workspacePlanCatalog).map(([planCode, plan]) => ({
            planCode,
            label: plan.label,
            description: plan.description,
            assessmentLimit: plan.assessmentLimit,
            participantLimit: plan.participantLimit,
            teamMemberLimit: plan.teamMemberLimit,
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
        })),
        recentCheckoutSessions,
        recentInvoices,
    };
}
export async function updateWorkspaceSubscriptionSelection(input) {
    const account = await requireActiveCustomer(input.customerAccountId);
    const existing = await ensureWorkspaceSubscription(account);
    const updated = await updateWorkspaceSubscription(buildSubscriptionPayload({
        customerAccountId: input.customerAccountId,
        planCode: input.planCode,
        status: 'active',
        billingCycle: input.billingCycle,
        billingProvider: existing.billingProvider,
        providerCustomerId: existing.providerCustomerId,
        providerSubscriptionId: existing.providerSubscriptionId,
        providerPriceId: existing.providerPriceId,
        planVersion: existing.planVersion + 1,
        billingContactEmail: existing.billingContactEmail ?? account.email,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        pastDueAt: null,
        suspendedAt: null,
    }));
    if (!updated) {
        throw new HttpError(500, 'Workspace subscription could not be updated');
    }
    const checkoutSession = await createBillingCheckoutSession({
        customerAccountId: input.customerAccountId,
        workspaceSubscriptionId: updated.id,
        billingProvider: updated.billingProvider,
        planCode: updated.planCode,
        billingCycle: updated.billingCycle,
        status: 'completed',
        checkoutUrl: null,
        expiresAt: null,
        completedAt: new Date().toISOString(),
        metadata: {
            mode: 'dummy',
            triggeredBy: 'workspace_billing_page',
            previousPlanCode: existing.planCode,
            nextPlanCode: updated.planCode,
        },
    });
    await createBillingInvoice({
        customerAccountId: input.customerAccountId,
        workspaceSubscriptionId: updated.id,
        checkoutSessionId: checkoutSession?.id ?? null,
        externalInvoiceId: null,
        invoiceNumber: `INV-${updated.id}-${Date.now()}`,
        status: 'paid',
        currencyCode: 'USD',
        amountSubtotal: getPlanPrice(updated.planCode, updated.billingCycle),
        amountTotal: getPlanPrice(updated.planCode, updated.billingCycle),
        hostedInvoiceUrl: null,
        invoicePdfUrl: null,
        issuedAt: new Date().toISOString(),
        dueAt: null,
        paidAt: new Date().toISOString(),
        metadata: {
            mode: 'dummy',
            planCode: updated.planCode,
            billingCycle: updated.billingCycle,
        },
    });
    await recordWorkspaceUsageEvent({
        customerAccountId: input.customerAccountId,
        workspaceSubscriptionId: updated.id,
        metricKey: 'assessment_created',
        quantity: 0,
        referenceType: 'workspace_subscription',
        referenceId: updated.id,
        metadata: {
            category: 'billing',
            action: 'workspace_subscription.updated',
            previousPlanCode: existing.planCode,
            nextPlanCode: updated.planCode,
            billingCycle: updated.billingCycle,
        },
    });
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
            checkoutSessionId: checkoutSession?.id ?? null,
        },
    });
    return getWorkspaceBillingOverview(input.customerAccountId);
}
export async function getWorkspaceBillingInvoices(customerAccountId) {
    const account = await requireActiveCustomer(customerAccountId);
    await ensureWorkspaceSubscription(account);
    return {
        account: mapAccount(account),
        invoices: await fetchBillingInvoices(customerAccountId, 20),
    };
}
export async function createWorkspaceCheckoutSession(input) {
    const account = await requireActiveCustomer(input.customerAccountId);
    const subscription = await ensureWorkspaceSubscription(account);
    const session = await createBillingCheckoutSession({
        customerAccountId: input.customerAccountId,
        workspaceSubscriptionId: subscription.id,
        billingProvider: subscription.billingProvider,
        planCode: input.planCode,
        billingCycle: input.billingCycle,
        status: 'open',
        checkoutUrl: `https://billing.vanaila.local/checkout/${subscription.id}`,
        expiresAt: addDays(1),
        completedAt: null,
        metadata: {
            mode: 'dummy',
            currentPlanCode: subscription.planCode,
            nextPlanCode: input.planCode,
        },
    });
    if (!session) {
        throw new HttpError(500, 'Billing checkout session could not be created');
    }
    await createAuditEvent({
        actorType: 'system',
        entityType: 'billing_checkout_session',
        entityId: session.id,
        action: 'billing_checkout_session.created',
        metadata: {
            customerAccountId: input.customerAccountId,
            planCode: input.planCode,
            billingCycle: input.billingCycle,
            billingProvider: subscription.billingProvider,
        },
    });
    return {
        checkoutSession: session,
        overview: await getWorkspaceBillingOverview(input.customerAccountId),
    };
}
export async function recordWorkspaceUsageMetric(input) {
    const account = await requireActiveCustomer(input.customerAccountId);
    const subscription = await ensureWorkspaceSubscription(account);
    await recordWorkspaceUsageEvent({
        customerAccountId: input.customerAccountId,
        workspaceSubscriptionId: subscription.id,
        metricKey: input.metricKey,
        quantity: input.quantity ?? 1,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        metadata: input.metadata ?? {},
    });
    await syncWorkspaceUsageSnapshot(input.customerAccountId, subscription);
}
async function getCapacityState(customerAccountId) {
    const overview = await getWorkspaceBillingOverview(customerAccountId);
    return {
        subscription: overview.subscription,
        usage: overview.usage,
    };
}
export async function assertAssessmentCreationCapacity(customerAccountId) {
    const { subscription, usage } = await getCapacityState(customerAccountId);
    if (usage.activeAssessmentCount >= subscription.assessmentLimit) {
        throw new HttpError(409, 'Assessment limit reached for this workspace plan');
    }
}
export async function assertParticipantCapacity(customerAccountId, additionalParticipants = 1) {
    const { subscription, usage } = await getCapacityState(customerAccountId);
    if (usage.participantRecordCount + additionalParticipants > subscription.participantLimit) {
        throw new HttpError(409, 'Participant limit reached for this workspace plan');
    }
}
export async function assertTeamMemberCapacity(customerAccountId, additionalSeats = 1) {
    const { subscription, usage } = await getCapacityState(customerAccountId);
    if (usage.teamSeatCount + additionalSeats > subscription.teamMemberLimit) {
        throw new HttpError(409, 'Team member limit reached for this workspace plan');
    }
}
