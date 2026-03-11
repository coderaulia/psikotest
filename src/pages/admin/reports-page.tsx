import { useEffect, useState } from 'react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboardSummary } from '@/services/admin-data';
import type { DashboardSummaryResponse } from '@/types/assessment';

function DistributionCard({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Live data from scored assessments.</CardDescription>
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
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setIsLoading(true);
    setError(null);

    try {
      setData(await fetchDashboardSummary());
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
    return <StateCard title="Loading reports" description="Preparing live distribution and summary reporting." />;
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
        description="Live score summaries, distributions, and recent participant trends from the current dataset."
      />
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
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionCard title="DISC Distribution" items={data.distributions.disc} />
        <DistributionCard title="Workload Distribution" items={data.distributions.workload} />
      </div>
      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Recent participant outcomes</CardTitle>
          <CardDescription>Most recent scored assessments across all modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentParticipants.length === 0 ? (
            <p className="text-sm text-slate-500">No recent scored participants yet.</p>
          ) : (
            data.recentParticipants.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-950">{item.fullName}</p>
                <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
