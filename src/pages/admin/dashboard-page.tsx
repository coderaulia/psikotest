import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboardSummary } from '@/services/admin-data';
import type { DashboardSummaryResponse } from '@/types/assessment';
import { formatDateTime } from '@/lib/formatters';

function DistributionCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No scored data available yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-950"
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    setIsLoading(true);
    setError(null);

    try {
      setData(await fetchDashboardSummary());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  if (isLoading && !data) {
    return <StateCard title="Loading dashboard" description="Pulling live admin metrics and recent activity." />;
  }

  if (error && !data) {
    return <StateCard title="Dashboard unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadSummary()} />;
  }

  if (!data) {
    return <StateCard title="No dashboard data" description="No dashboard data is available yet." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="Assessment overview"
        description="Track active sessions, completions, and recent outcomes from a single premium workspace."
      />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((metric) => (
          <Card key={metric.label} className="bg-white/80">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-4xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500">{metric.delta}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Live sessions</CardTitle>
            <CardDescription>Session health, delivery status, and participant completion snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.liveSessions.length === 0 ? (
              <p className="text-sm text-slate-500">No sessions have been created yet.</p>
            ) : (
              data.liveSessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/admin/test-sessions/${session.id}`}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-950">{session.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{session.testType} assessment</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Badge>{session.status}</Badge>
                    <span>{session.completed}/{session.participants} completed</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Recent completions</CardTitle>
            <CardDescription>Latest participants who finished an assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentParticipants.length === 0 ? (
              <p className="text-sm text-slate-500">No completions have been scored yet.</p>
            ) : (
              data.recentParticipants.map((result) => (
                <Link key={result.id} to={`/admin/results/${result.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{result.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">{result.summary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateTime(result.completedAt)}</p>
                    </div>
                    <Badge>{result.testType}</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DistributionCard
          title="DISC Distribution"
          description="Dominant profile spread across scored DISC assessments."
          items={data.distributions.disc}
        />
        <DistributionCard
          title="Workload Distribution"
          description="Current workload bands across scored workload assessments."
          items={data.distributions.workload}
        />
      </div>
    </div>
  );
}
