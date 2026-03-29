import { useEffect, useState } from 'react';
import { Copy, ExternalLink, FlaskConical, Link as LinkIcon, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { canAccessWorkspaceBilling, canAccessWorkspaceSettings, canAccessWorkspaceTeam, canOperateAssessments } from '@/lib/customer-access';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { loadCustomerSession } from '@/lib/customer-session';
import { getCustomerBillingOverview } from '@/services/customer-billing';
import { listCustomerAssessments } from '@/services/customer-onboarding';
import type { CustomerAssessmentItem, CustomerBillingOverviewResponse } from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function renderAudienceSummary(item: CustomerAssessmentItem) {
  return `Participant: ${formatTokenLabel(item.participantResultAccess)} | HR: ${formatTokenLabel(item.hrResultAccess)}`;
}

export function CustomerWorkspacePage() {
  const customerSession = loadCustomerSession();
  const role = customerSession?.account.workspaceRole ?? 'owner';
  const [items, setItems] = useState<CustomerAssessmentItem[]>([]);
  const [billing, setBilling] = useState<CustomerBillingOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([listCustomerAssessments(), getCustomerBillingOverview()])
      .then(([assessmentItems, billingOverview]) => {
        if (!mounted) {
          return;
        }

        setItems(assessmentItems);
        setBilling(billingOverview);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace');
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

  async function handleCopyLink(link: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(link);
    setSuccessMessage('Participant link copied to clipboard.');
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading your workspace...</CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!billing) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Your assessment drafts and active links</p>
          <h2 className="text-2xl font-semibold tracking-tight">Review before sharing, then activate deliberately</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {canAccessWorkspaceBilling(role) ? (
            <Button variant="secondary" asChild>
              <Link to="/workspace/billing">Workspace billing</Link>
            </Button>
          ) : null}
          {canAccessWorkspaceTeam(role) ? (
            <Button variant="secondary" asChild>
              <Link to="/workspace/team">Workspace team</Link>
            </Button>
          ) : null}
          <Button variant="secondary" asChild>
            <Link to="/workspace/results">Workspace results</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/workspace/activity">Workspace activity</Link>
          </Button>
          {canAccessWorkspaceSettings(role) ? (
            <Button variant="secondary" asChild>
              <Link to="/workspace/settings">Workspace settings</Link>
            </Button>
          ) : null}
          {canOperateAssessments(role) ? (
            <Button asChild>
              <Link to="/workspace/create">Create another assessment</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Current plan</CardDescription>
            <CardTitle>{billing.subscription.planLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{billing.subscription.planDescription}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Assessment capacity</CardDescription>
            <CardTitle>{billing.usage.activeAssessmentCount} / {billing.subscription.assessmentLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{billing.usage.remainingAssessmentSlots} draft/live slots remaining</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Participant records</CardDescription>
            <CardTitle>{billing.usage.participantRecordCount} / {billing.subscription.participantLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{billing.usage.remainingParticipantSlots} participant records remaining</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Team seats</CardDescription>
            <CardTitle>{billing.usage.teamSeatCount} / {billing.subscription.teamMemberLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{billing.usage.remainingTeamSeats} seats remaining</CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950 text-white">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55">
              <Sparkles className="h-3.5 w-3.5" />
              Dummy billing mode
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Plan limits are enforced in the workspace already. Upgrade the dummy subscription before you run out of draft, participant, or team capacity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/10 bg-white/10 text-white">{formatTokenLabel(billing.subscription.status)}</Badge>
            <Badge className="border-white/10 bg-white/10 text-white">{formatTokenLabel(billing.subscription.billingCycle)}</Badge>
            {canAccessWorkspaceBilling(role) ? (
              <Button variant="secondary" asChild>
                <Link to="/workspace/billing">Manage plan</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="bg-white/82">
          <CardHeader>
            <CardTitle>No assessment drafts yet</CardTitle>
            <CardDescription>Create your first guided assessment draft to generate a participant link and preview experience.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            {canOperateAssessments(role) ? (
              <Button asChild>
                <Link to="/workspace/create">Create first assessment</Link>
              </Button>
            ) : null}
            {canAccessWorkspaceSettings(role) ? (
              <Button variant="secondary" asChild>
                <Link to="/workspace/settings">Review workspace settings</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {items.map((item) => {
          const isActive = item.sessionStatus === 'active';

          return (
            <Card key={item.assessmentId} className="bg-white/84">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.organizationName}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(item.testType)}</Badge>
                    <Badge className={isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                      {isActive ? 'Sharing active' : 'Draft review'}
                    </Badge>
                    <Badge className={item.planStatus === 'upgraded' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}>
                      {formatTokenLabel(item.planStatus)}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Purpose</p>
                    <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.assessmentPurpose)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participants</p>
                    <p className="mt-2 font-medium text-slate-950">{item.participantLimit ?? 'Flexible'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Distribution</p>
                    <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.distributionPolicy)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Created</p>
                    <p className="mt-2 font-medium text-slate-950">{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-500">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(item.distributionPolicy)}</Badge>
                    {item.protectedDeliveryMode ? <Badge className="border-sky-200 bg-sky-50 text-sky-700">Protected delivery</Badge> : null}
                  </div>
                  <p className="mt-4 font-medium text-slate-950">Participant link</p>
                  <p className="mt-2 break-all text-slate-500">{item.participantLink}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {isActive
                      ? 'This link is active and ready for participant distribution.'
                      : 'This link is prepared but remains private until you review and activate sharing.'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button size="lg" className="sm:flex-1" asChild>
                    <Link to={`/workspace/assessments/${item.assessmentId}`}>{isActive ? 'Manage live link' : 'Review draft'}</Link>
                  </Button>
                  <Button variant="secondary" size="lg" className="sm:flex-1" asChild>
                    <a href={item.previewDemoLink} target="_blank" rel="noreferrer">
                      Preview demo <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  {isActive ? (
                    <Button variant="outline" size="lg" type="button" className="sm:flex-1" onClick={() => void handleCopyLink(item.participantLink)}>
                      Copy live link <Copy className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Users className="h-4 w-4" /> Participant access</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{formatTokenLabel(item.participantResultAccess)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> HR access</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{formatTokenLabel(item.hrResultAccess)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-950"><FlaskConical className="h-4 w-4" /> Delivery mode</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{item.protectedDeliveryMode ? 'Progressive protected delivery' : 'Full session delivery'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-950"><LinkIcon className="h-4 w-4" /> Visibility note</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{renderAudienceSummary(item)}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-6 text-sky-700">
                  Customer workspace views only show audience-facing policy information. Reviewer notes and internal draft interpretations remain hidden until formally released.
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



