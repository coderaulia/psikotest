import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchResultDetail } from '@/services/admin-data';
import type { StoredResultDetailRecord } from '@/types/assessment';
import {
  formatDateTime,
  formatResultHeadline,
  formatResultSummary,
  formatTokenLabel,
} from '@/lib/formatters';

export function ResultDetailPage() {
  const { id } = useParams();
  const resultId = Number(id);
  const [result, setResult] = useState<StoredResultDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadResult() {
    setIsLoading(true);
    setError(null);

    try {
      setResult(await fetchResultDetail(resultId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load result detail');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(resultId)) {
      void loadResult();
    }
  }, [resultId]);

  if (!Number.isFinite(resultId)) {
    return <StateCard title="Invalid result" description="The requested result id is not valid." tone="danger" />;
  }

  if (isLoading && !result) {
    return <StateCard title="Loading result" description="Pulling participant details and scoring summaries." />;
  }

  if (error && !result) {
    return <StateCard title="Result unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadResult()} />;
  }

  if (!result) {
    return <StateCard title="Result not found" description="The requested result could not be found." tone="danger" />;
  }

  const note = typeof result.resultPayload.note === 'string' ? result.resultPayload.note : null;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Result Detail"
        title={result.participant.fullName}
        description={`${result.testType.toUpperCase()} assessment • ${formatDateTime(result.submittedAt)}`}
        actions={<Button variant="outline" asChild><Link to={`/admin/test-sessions/${result.session.id}`}>Open session</Link></Button>}
      />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Primary result</CardDescription>
            <CardTitle>
              {formatResultHeadline({
                testType: result.testType,
                primaryType: result.primaryType,
                secondaryType: result.secondaryType,
                profileCode: result.profileCode,
                scoreBand: result.scoreBand,
                scoreTotal: result.scoreTotal,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Summary</CardDescription>
            <CardTitle>{formatResultSummary({ testType: result.testType, primaryType: result.primaryType, secondaryType: result.secondaryType, scoreBand: result.scoreBand })}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Interpretation</CardDescription>
            <CardTitle>{formatTokenLabel(result.interpretationKey)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Session</CardDescription>
            <CardTitle>{result.session.title}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Participant profile</CardTitle>
            <CardDescription>Identity fields captured before the assessment started.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p><p className="mt-2 font-medium text-slate-950">{result.participant.email}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Employee Code</p><p className="mt-2 font-medium text-slate-950">{result.participant.employeeCode ?? '-'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Department</p><p className="mt-2 font-medium text-slate-950">{result.participant.department ?? '-'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Position</p><p className="mt-2 font-medium text-slate-950">{result.participant.positionTitle ?? '-'}</p></div>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>Chart-ready metrics stored with the scored result.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {result.summaries.map((summary) => (
                <div key={summary.metricKey} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-950">{summary.metricLabel}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.score}</p>
                  {summary.band ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{formatTokenLabel(summary.band)}</p> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {note ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{note}</div>
      ) : null}
    </div>
  );
}
