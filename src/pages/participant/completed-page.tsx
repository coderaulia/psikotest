import { Link, useParams } from 'react-router-dom';

import { loadParticipantSession } from '@/lib/participant-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function formatTokenLabel(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function ParticipantCompletedPage() {
  const { token = 'disc-batch-a' } = useParams();
  const storedSession = loadParticipantSession(token);
  const result = storedSession?.result;
  const note = typeof result?.resultPayload.note === 'string' ? result.resultPayload.note : null;

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82 text-center">
      <CardHeader>
        <CardTitle>Assessment completed</CardTitle>
        <CardDescription>Your responses have been submitted successfully.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-left text-sm leading-7 text-slate-500">
          <p className="font-medium text-slate-950">{storedSession?.participant.fullName ?? 'Participant'}</p>
          {result ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Primary result</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {result.profileCode ?? result.scoreTotal ?? '-'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interpretation</p>
                <p className="mt-2 text-base font-medium text-slate-950">
                  {formatTokenLabel(result.scoreBand ?? result.interpretationKey)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4">Result summary is not available yet.</p>
          )}
        </div>

        {result ? (
          <div className="grid gap-3 text-left md:grid-cols-2">
            {result.summaries.map((summary) => (
              <div key={summary.metricKey} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                <p className="font-medium text-slate-950">{summary.metricLabel}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.score}</p>
                {summary.band ? <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{formatTokenLabel(summary.band)}</p> : null}
              </div>
            ))}
          </div>
        ) : null}

        {note ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">
            {note}
          </div>
        ) : null}

        <Button variant="secondary" asChild>
          <Link to="/">Return to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
