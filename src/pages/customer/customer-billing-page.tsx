import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, CreditCard, ShieldCheck, Users } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { getWorkspaceUsageSeverityClasses, getWorkspaceUsageSeverityLabel } from '@/lib/workspace-billing';
import { getCustomerBillingOverview, updateCustomerSubscription } from '@/services/customer-billing';
import type {
  CustomerBillingOverviewResponse,
  WorkspaceBillingCycle,
  WorkspacePlanCode,
  WorkspaceUsageDiagnostic,
} from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const cycleLabels: Record<WorkspaceBillingCycle, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

const dummyPrices: Record<WorkspacePlanCode, Record<WorkspaceBillingCycle, string>> = {
  starter: { monthly: '$0', annual: '$0' },
  growth: { monthly: '$29', annual: '$290' },
  research: { monthly: '$39', annual: '$390' },
};

function formatCurrency(amount: number, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderDiagnosticCard(diagnostic: WorkspaceUsageDiagnostic) {
  const tone = getWorkspaceUsageSeverityClasses(diagnostic.severity);

  return (
    <div key={diagnostic.resource} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-950">{diagnostic.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {diagnostic.current} / {diagnostic.limit}
          </p>
        </div>
        <Badge className={tone.badge}>{getWorkspaceUsageSeverityLabel(diagnostic.severity)}</Badge>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-200">
        <div className={cn('h-2 rounded-full transition-all', tone.progress)} style={{ width: `${Math.max(diagnostic.utilizationPercent, 6)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{diagnostic.utilizationPercent}% used</span>
        <span>{diagnostic.remaining} remaining</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{diagnostic.message}</p>
      {diagnostic.suggestedPlanLabel ? (
        <p className="mt-2 text-xs font-medium text-slate-700">Suggested plan: {diagnostic.suggestedPlanLabel}</p>
      ) : null}
    </div>
  );
}

export function CustomerBillingPage() {
  const [overview, setOverview] = useState<CustomerBillingOverviewResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlanCode>('starter');
  const [billingCycle, setBillingCycle] = useState<WorkspaceBillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getCustomerBillingOverview()
      .then((payload) => {
        if (!mounted) {
          return;
        }

        setOverview(payload);
        setSelectedPlan(payload.subscription.planCode);
        setBillingCycle(payload.subscription.billingCycle);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load billing overview');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlanDefinition = useMemo(
    () => overview?.plans.find((plan) => plan.planCode === selectedPlan) ?? null,
    [overview, selectedPlan],
  );
  const recentInvoices = overview?.recentInvoices ?? [];
  const recentCheckoutSessions = overview?.recentCheckoutSessions ?? [];

  async function handleSavePlan() {
    if (!overview) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const next = await updateCustomerSubscription({
        selectedPlan,
        billingCycle,
      });
      setOverview(next);
      setSuccessMessage('Dummy subscription updated for this workspace.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update workspace plan');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading billing overview...</CardContent>
      </Card>
    );
  }

  if (errorMessage && !overview) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!overview) {
    return null;
  }

  const subscription = overview.subscription;
  const usage = overview.usage;
  const guidance = overview.upgradeGuidance;
  const guidanceTone = getWorkspaceUsageSeverityClasses(guidance.highestSeverity);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Workspace plan and usage</p>
          <h2 className="text-2xl font-semibold tracking-tight">Control plan limits before you scale participant sharing</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{subscription.planLabel}</Badge>
          <Badge className="border-sky-200 bg-sky-50 text-sky-700">{formatTokenLabel(subscription.status)}</Badge>
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">{subscription.billingProvider === 'dummy' ? 'Dummy billing' : `${formatTokenLabel(subscription.billingProvider ?? 'dummy')} billing`}</Badge>
        </div>
      </div>

      {guidance.isUpgradeRecommended ? (
        <Card className={cn('border bg-white/88', guidanceTone.panel)}>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {guidance.suggestedPlanLabel
                  ? `Upgrade recommended: ${guidance.suggestedPlanLabel}`
                  : 'Current workspace plan needs attention'}
              </p>
              <div className="space-y-2 text-sm leading-6">
                {guidance.reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            </div>
            {guidance.suggestedPlanLabel ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
                {guidance.suggestedPlanLabel}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Plan</CardDescription>
            <CardTitle>{subscription.planLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{subscription.planDescription}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Active assessments</CardDescription>
            <CardTitle>{usage.activeAssessmentCount} / {subscription.assessmentLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingAssessmentSlots} slots remaining</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Participants</CardDescription>
            <CardTitle>{usage.participantRecordCount} / {subscription.participantLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingParticipantSlots} records remaining</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Team seats</CardDescription>
            <CardTitle>{usage.teamSeatCount} / {subscription.teamMemberLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingTeamSeats} seats remaining</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {overview.diagnostics.map(renderDiagnosticCard)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="bg-white/84">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Change workspace plan</CardTitle>
                <CardDescription>Use the dummy billing step to simulate trial upgrades, renewal cycles, and limit changes.</CardDescription>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-sm">
                {(['monthly', 'annual'] as WorkspaceBillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`rounded-full px-4 py-2 transition ${billingCycle === cycle ? 'bg-slate-950 text-white' : 'text-slate-500'}`}
                  >
                    {cycleLabels[cycle]}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {overview.plans.map((plan) => {
                const isSelected = selectedPlan === plan.planCode;
                const isRecommended = overview.upgradeGuidance.suggestedPlanCode === plan.planCode;
                const isCurrent = subscription.planCode === plan.planCode;

                return (
                  <button
                    key={plan.planCode}
                    type="button"
                    onClick={() => setSelectedPlan(plan.planCode)}
                    className={`rounded-[26px] border p-5 text-left transition ${isSelected ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{plan.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {isCurrent ? <Badge className="border-white/10 bg-white/10 text-white">Current</Badge> : null}
                        {isRecommended ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Recommended</Badge> : null}
                      </div>
                    </div>
                    <p className={`mt-3 text-3xl font-semibold ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                      {plan[billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'] != null ? formatCurrency(plan[billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'] ?? 0) : dummyPrices[plan.planCode][billingCycle]}
                    </p>
                    <p className={`mt-3 text-sm leading-7 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>{plan.description}</p>
                    <div className={`mt-4 grid gap-2 text-sm ${isSelected ? 'text-white/85' : 'text-slate-600'}`}>
                      <span>{plan.assessmentLimit} active or draft assessments</span>
                      <span>{plan.participantLimit} participant records</span>
                      <span>{plan.teamMemberLimit} team seats</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Selected plan:{' '}
                <span className="font-medium text-slate-950">{selectedPlanDefinition?.label ?? subscription.planLabel}</span>
                {' '}({cycleLabels[billingCycle].toLowerCase()})
              </div>
              <Button type="button" size="lg" onClick={handleSavePlan} disabled={isSubmitting}>
                {isSubmitting ? 'Saving dummy subscription...' : 'Save workspace plan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>Usage guardrails</CardTitle>
              <CardDescription className="text-white/70">Plan limits are now enforced during assessment creation, participant additions, and team growth.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><BarChart3 className="h-4 w-4" /> Assessment creation</p>
                <p className="mt-2">Drafts and active sessions both count against the workspace plan.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><Users className="h-4 w-4" /> Participant records</p>
                <p className="mt-2">Imports, manual adds, and participant operations all consume workspace volume.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><ShieldCheck className="h-4 w-4" /> Team seats</p>
                <p className="mt-2">Owners and invited members consume workspace seat capacity.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Current subscription timeline</CardTitle>
              <CardDescription>Dummy billing now stores provider-ready period, checkout, and invoice history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-500">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-slate-950"><CreditCard className="h-4 w-4" /> Billing cycle</p>
                <p className="mt-2">{cycleLabels[subscription.billingCycle]}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">Current period</p>
                <p className="mt-2">
                  {subscription.currentPeriodStart && subscription.currentPeriodEnd
                    ? `${formatDateTime(subscription.currentPeriodStart)} to ${formatDateTime(subscription.currentPeriodEnd)}`
                    : 'Current billing period will appear after activation'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">Trial ends</p>
                <p className="mt-2">{subscription.trialEndsAt ? formatDateTime(subscription.trialEndsAt) : 'No active trial window'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">Next renewal</p>
                <p className="mt-2">{subscription.renewsAt ? formatDateTime(subscription.renewsAt) : 'Renewal will appear after dummy activation'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">Billing contact</p>
                <p className="mt-2">{subscription.billingContactEmail ?? overview.account.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Recent billing activity</CardTitle>
              <CardDescription>Checkout attempts and invoices are now tracked for the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-500">
              <div className="space-y-3">
                <p className="font-medium text-slate-950">Recent checkout sessions</p>
                {recentCheckoutSessions.length > 0 ? recentCheckoutSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-950">{formatTokenLabel(session.planCode)} · {cycleLabels[session.billingCycle]}</span>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(session.status)}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Created {formatDateTime(session.createdAt)}</p>
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">No checkout sessions recorded yet.</p>}
              </div>
              <div className="space-y-3">
                <p className="font-medium text-slate-950">Recent invoices</p>
                {recentInvoices.length > 0 ? recentInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-950">{invoice.invoiceNumber ?? `Invoice #${invoice.id}`}</span>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(invoice.status)}</Badge>
                    </div>
                    <p className="mt-2">{formatCurrency(invoice.amountTotal, invoice.currencyCode)}</p>
                    <p className="mt-1 text-xs text-slate-400">{invoice.paidAt ? `Paid ${formatDateTime(invoice.paidAt)}` : invoice.issuedAt ? `Issued ${formatDateTime(invoice.issuedAt)}` : 'Pending invoice date'}</p>
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">No invoices have been generated yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}








