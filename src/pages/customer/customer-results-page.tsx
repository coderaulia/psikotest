import { useEffect, useState } from 'react';
import { EyeOff, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { getCustomerWorkspaceResults } from '@/services/customer-results';
import type { CustomerWorkspaceResultsResponse } from '@/types/assessment';

export function CustomerResultsPage() {
  const [data, setData] = useState<CustomerWorkspaceResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getCustomerWorkspaceResults()
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace results');
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
        <CardContent className="p-8 text-sm text-slate-500">Loading workspace results...</CardContent>
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
          <p className="text-sm text-slate-500">Customer-visible outcome monitoring</p>
          <h2 className="text-2xl font-semibold tracking-tight">Assessment results that respect release and visibility rules</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" asChild>
            <Link to="/workspace">Back to assessments</Link>
          </Button>
          <Button asChild>
            <Link to="/workspace/create">Create another assessment</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Total results</CardDescription>
            <CardTitle>{data.summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Completed participant results available across your workspace.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Released</CardDescription>
            <CardTitle>{data.summary.released}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Professional summaries that are safe to expose in the customer workspace.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Awaiting review</CardDescription>
            <CardTitle>{data.summary.awaitingReview}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Results still being reviewed by an internal psychologist or reviewer.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Hidden drafts</CardDescription>
            <CardTitle>{data.summary.hiddenDrafts}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Reviewer drafts stay hidden from the customer workspace until release.</CardContent>
        </Card>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>No results yet</CardTitle>
            <CardDescription>Once participants finish an active assessment, their results will appear here with release-aware visibility.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {data.items.map((item) => (
          <Card key={item.resultId} className="bg-white/84">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{item.participantName}</CardTitle>
                  <CardDescription>{item.assessmentTitle}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(item.testType)}</Badge>
                  <Badge className={item.reviewStatus === 'released' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                    {formatTokenLabel(item.reviewStatus)}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Submitted</p>
                  <p className="mt-2 font-medium text-slate-950">{formatDateTime(item.submittedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Score band</p>
                  <p className="mt-2 font-medium text-slate-950">{item.scoreBand ?? item.profileCode ?? 'Pending release'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Distribution</p>
                  <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.distributionPolicy)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participant access</p>
                  <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.participantResultAccess)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-500">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-950">Participant</p>
                <p className="mt-2">{item.participantEmail}</p>
                {item.scoreTotal !== null ? <p className="mt-2 text-xs text-slate-400">Numeric score: {item.scoreTotal}</p> : null}
              </div>

              {item.releasedSummary ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><FileText className="h-4 w-4" /> Released professional summary</p>
                  <p className="mt-3 leading-7 text-slate-600">{item.releasedSummary}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><EyeOff className="h-4 w-4" /> Internal review still protected</p>
                  <p className="mt-3 leading-7 text-slate-600">{item.visibilityNote}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> HR access</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{formatTokenLabel(item.hrResultAccess)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Sparkles className="h-4 w-4" /> Delivery</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{item.protectedDeliveryMode ? 'Protected progressive' : 'Full session delivery'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><FileText className="h-4 w-4" /> Assessment</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{item.assessmentTitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
