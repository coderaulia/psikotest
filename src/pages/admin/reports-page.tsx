import { useEffect, useState } from 'react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchReportsSummary } from '@/services/admin-data';
import type { ReportsSummaryResponse } from '@/types/assessment';
import { formatDateTime, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

function DistributionCard({ title, items, description }: { title: string; description: string; items: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No data available yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-950" style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setIsLoading(true);
    setError(null);

    try {
      setData(await fetchReportsSummary());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  if (isLoading && !data) {
    return <StateCard title="Loading reports" description="Preparing live distribution and review reporting." />;
  }

  if (error && !data) {
    return <StateCard title="Reports unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadReports()} />;
  }

  if (!data) {
    return <StateCard title="No report data" description="Report data is not available yet." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Reports"
        title="Reporting workspace"
        description="Chart-ready reporting, review queues, and score averages from live result data."
      />

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {data.summaryCards.map((card) => (
          <Card key={card.label} className="bg-white/80">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle>{card.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500">{card.delta}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Average score by test type</CardTitle>
          <CardDescription>Operational benchmark for each assessment module using stored result totals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.averagesByTestType.length === 0 ? (
            <p className="text-sm text-slate-500">No scored results available yet.</p>
          ) : (
            data.averagesByTestType.map((item) => (
              <div key={item.testType} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{formatTestTypeLabel(item.testType)}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{item.averageScore ?? '-'}</p>
                <p className="mt-2 text-sm text-slate-500">{item.submissionCount} scored submissions</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <DistributionCard title="DISC Distribution" description="Dominant DISC outcomes from scored DISC sessions." items={data.distributions.disc} />
        <DistributionCard title="Workload Distribution" description="Current workload band spread from workload assessments." items={data.distributions.workload} />
        <DistributionCard title="Review Status" description="How many results still need professional review." items={data.distributions.reviewStatus} />
      </div>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Recent completions</CardTitle>
          <CardDescription>Latest result records across all active assessment modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentCompletions.length === 0 ? (
            <p className="text-sm text-slate-500">No recent scored participants yet.</p>
          ) : (
            data.recentCompletions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{item.participantName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.sessionTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{formatTestTypeLabel(item.testType)}</Badge>
                    <Badge>{formatTokenLabel(item.reviewStatus)}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

