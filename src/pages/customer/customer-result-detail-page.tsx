import { useEffect, useState } from 'react';
import { EyeOff, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { getCustomerWorkspaceResultDetail } from '@/services/customer-results';
import type { CustomerWorkspaceResultDetail } from '@/types/assessment';

export function CustomerResultDetailPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [data, setData] = useState<CustomerWorkspaceResultDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const numericId = Number(resultId ?? 0);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      setErrorMessage('Invalid result identifier');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void getCustomerWorkspaceResultDetail(numericId)
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace result');
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
  }, [resultId]);

  if (isLoading) {
    return (
      <Card className="bg-white/84">
        <CardContent className="p-8 text-sm text-slate-500">Loading workspace result...</CardContent>
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
          <p className="text-sm text-slate-500">Customer-safe result review</p>
          <h2 className="text-2xl font-semibold tracking-tight">{data.participantName}</h2>
          <p className="mt-2 text-sm text-slate-500">{data.assessmentTitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" asChild>
            <Link to="/workspace/results">Back to results</Link>
          </Button>
          <Button asChild>
            <Link to="/workspace">Workspace overview</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Review state</CardDescription>
            <CardTitle>{formatTokenLabel(data.reviewStatus)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Customer views follow release and distribution rules automatically.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Submitted</CardDescription>
            <CardTitle>{formatDateTime(data.submittedAt)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Participant completion timestamp captured from the assessment session.</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Distribution</CardDescription>
            <CardTitle>{formatTokenLabel(data.distributionPolicy)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Participant access: {formatTokenLabel(data.participantResultAccess)}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>Outcome</CardDescription>
            <CardTitle>{data.scoreBand ?? data.profileCode ?? 'Pending release'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Numeric score {data.scoreTotal ?? 'not exposed'} · HR access {formatTokenLabel(data.hrResultAccess)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-white/84">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(data.testType)}</Badge>
              <Badge className={data.reviewStatus === 'released' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                {formatTokenLabel(data.reviewStatus)}
              </Badge>
              {data.protectedDeliveryMode ? <Badge className="border-sky-200 bg-sky-50 text-sky-700">Protected delivery</Badge> : null}
            </div>
            <div>
              <CardTitle>Customer-facing interpretation</CardTitle>
              <CardDescription>Internal reviewer drafts stay hidden until formally released.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            {data.releasedSummary ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div>
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><FileText className="h-4 w-4" /> Released summary</p>
                  <p className="mt-3 leading-7">{data.releasedSummary}</p>
                </div>
                {data.releasedRecommendation ? (
                  <div>
                    <p className="font-medium text-slate-950">Recommendation</p>
                    <p className="mt-2 leading-7">{data.releasedRecommendation}</p>
                  </div>
                ) : null}
                {data.releasedLimitations ? (
                  <div>
                    <p className="font-medium text-slate-950">Interpretation note</p>
                    <p className="mt-2 leading-7">{data.releasedLimitations}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                <p className="inline-flex items-center gap-2 font-medium text-slate-950"><EyeOff className="h-4 w-4" /> Review content protected</p>
                <p className="mt-3 leading-7">{data.visibilityNote}</p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> Visibility note</p>
              <p className="mt-3 leading-7">{data.visibilityNote}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Participant context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Name</p>
                <p className="mt-2 font-medium text-slate-950">{data.participantName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Email</p>
                <p className="mt-2 font-medium text-slate-950">{data.participantEmail}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Assessment</p>
                <p className="mt-2 font-medium text-slate-950">{data.assessmentTitle}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
              <CardDescription>Metrics already safe for the customer workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {data.metrics.length === 0 ? (
                <p className="text-sm text-slate-500">No category metrics were recorded for this result.</p>
              ) : (
                data.metrics.map((metric) => (
                  <div key={metric.metricKey} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{metric.metricLabel}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{metric.metricKey}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-950">{metric.score}</p>
                        {metric.band ? <p className="mt-1 text-xs text-slate-400">{metric.band}</p> : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-950 text-white">
            <CardContent className="p-5 text-sm leading-7 text-white/70">
              <p className="inline-flex items-center gap-2 font-medium text-white"><Sparkles className="h-4 w-4" /> Customer-safe report surface</p>
              <p className="mt-3">
                This detail page follows the same visibility policy as your workspace results list. Reviewer drafts remain hidden until release, while released summaries stay available for operational handoff.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
