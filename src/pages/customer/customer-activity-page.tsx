import { useEffect, useState } from 'react';
import { Building2, CreditCard, FileClock, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/formatters';
import { getCustomerWorkspaceActivity } from '@/services/customer-workspace';
import type { CustomerWorkspaceActivityItem, CustomerWorkspaceActivityResponse } from '@/types/assessment';

function getActivityIcon(category: CustomerWorkspaceActivityItem['category']) {
  switch (category) {
    case 'assessment':
      return FileClock;
    case 'participant_delivery':
      return Users;
    case 'team':
      return ShieldCheck;
    case 'billing':
      return CreditCard;
    default:
      return Building2;
  }
}

function getCategoryBadgeClass(category: CustomerWorkspaceActivityItem['category']) {
  switch (category) {
    case 'assessment':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'participant_delivery':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'team':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'billing':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export function CustomerActivityPage() {
  const [data, setData] = useState<CustomerWorkspaceActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getCustomerWorkspaceActivity()
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace activity');
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

  if (isLoading) {
    return (
      <Card className="bg-white/84">
        <CardContent className="p-8 text-sm text-slate-500">Loading workspace activity...</CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-white/84">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Workspace activity and operational trail</p>
          <h2 className="text-2xl font-semibold tracking-tight">See invites, reminders, setup changes, and billing updates in one feed</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" asChild>
            <Link to="/workspace/results">View results</Link>
          </Button>
          <Button asChild>
            <Link to="/workspace">Back to workspace</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Total events</CardDescription>
            <CardTitle>{data.summary.totalEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Recent workspace actions recorded for operations and audit tracking.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Assessments</CardDescription>
            <CardTitle>{data.summary.assessmentEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Draft creation, configuration changes, and share activation events.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Participant delivery</CardDescription>
            <CardTitle>{data.summary.participantDeliveryEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Invites, reminders, imports, and participant delivery operations.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Team events</CardDescription>
            <CardTitle>{data.summary.teamEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Workspace member invites, activations, and access changes.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Billing changes</CardDescription>
            <CardTitle>{data.summary.billingEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Dummy subscription changes and plan transitions in the current workspace.</CardContent>
        </Card>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>No activity yet</CardTitle>
            <CardDescription>Your workspace actions will appear here after drafts, invitations, or team changes are made.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="space-y-4">
        {data.items.map((item) => {
          const Icon = getActivityIcon(item.category);

          return (
            <Card key={item.id} className="bg-white/84">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-500">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getCategoryBadgeClass(item.category)}>{item.category.replace(/_/g, ' ')}</Badge>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatDateTime(item.createdAt)}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="uppercase tracking-[0.16em] text-slate-400">Action key</p>
                      <p className="mt-2 font-medium text-slate-950">{item.action}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="uppercase tracking-[0.16em] text-slate-400">Entity</p>
                      <p className="mt-2 font-medium text-slate-950">{item.entityType}{item.entityId ? ` #${item.entityId}` : ''}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="uppercase tracking-[0.16em] text-slate-400">Recorded by</p>
                      <p className="mt-2 font-medium text-slate-950">{item.actorName ?? item.actorType}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
