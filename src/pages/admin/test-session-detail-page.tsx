import { Copy, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTestSessionDetail } from '@/services/admin-data';
import type { AdminTestSessionDetail } from '@/types/assessment';
import { formatDateTime, formatStatusLabel, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

export function TestSessionDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [session, setSession] = useState<AdminTestSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSession() {
    setIsLoading(true);
    setError(null);

    try {
      setSession(await fetchTestSessionDetail(sessionId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load session detail');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(sessionId)) {
      void loadSession();
    }
  }, [sessionId]);

  async function handleCopyLink() {
    if (!session) {
      return;
    }

    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    await navigator.clipboard.writeText(`${origin}/t/${session.accessToken}`);
  }

  if (!Number.isFinite(sessionId)) {
    return <StateCard title="Invalid session" description="The requested session id is not valid." tone="danger" />;
  }

  if (isLoading && !session) {
    return <StateCard title="Loading session" description="Pulling participant progress and session metadata." />;
  }

  if (error && !session) {
    return <StateCard title="Session unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadSession()} />;
  }

  if (!session) {
    return <StateCard title="Session not found" description="The requested session could not be found." tone="danger" />;
  }

  const publicUrl = typeof window === 'undefined' ? `/t/${session.accessToken}` : `${window.location.origin}/t/${session.accessToken}`;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Session Detail"
        title={session.title}
        description={session.description ?? 'Review session progress, participants, and generated access details.'}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2" onClick={() => void handleCopyLink()}>
              <Copy className="h-4 w-4" /> Copy link
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open public flow
              </a>
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/80"><CardHeader><CardDescription>Status</CardDescription><CardTitle>{formatStatusLabel(session.status)}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Participants</CardDescription><CardTitle>{session.participantCount}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Completed</CardDescription><CardTitle>{session.completedCount}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Completion Rate</CardDescription><CardTitle>{session.completionRate}%</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Session metadata</CardTitle>
            <CardDescription>Distribution and sharing details for this assessment session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Test Type</p>
                <p className="mt-2 font-medium text-slate-950">{formatTestTypeLabel(session.testType)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Access Token</p>
                <p className="mt-2 font-medium text-slate-950">{session.accessToken}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Start Time</p>
                <p className="mt-2 font-medium text-slate-950">{formatDateTime(session.startsAt)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Time Limit</p>
                <p className="mt-2 font-medium text-slate-950">{session.timeLimitMinutes ? `${session.timeLimitMinutes} minutes` : 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>What participants see before they start this session.</CardDescription>
          </CardHeader>
          <CardContent>
            {session.instructions.length === 0 ? (
              <p className="text-sm text-slate-500">No instructions were saved for this session.</p>
            ) : (
              <div className="space-y-3">
                {session.instructions.map((instruction) => (
                  <div key={instruction} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {instruction}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Participant progress</CardTitle>
          <CardDescription>Submission attempts, current status, and linked result records.</CardDescription>
        </CardHeader>
        <CardContent>
          {session.participants.length === 0 ? (
            <StateCard title="No participants yet" description="Share the access link to start collecting participant submissions." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Participant</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Attempt</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {session.participants.map((participant) => (
                    <tr key={participant.submissionId}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-950">{participant.fullName}</p>
                          <p className="text-slate-500">{participant.positionTitle ?? participant.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4"><Badge>{formatStatusLabel(participant.status)}</Badge></td>
                      <td className="px-4 py-4 text-slate-500">#{participant.attemptNo}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {participant.resultId ? <Link className="font-medium text-slate-950 underline-offset-4 hover:underline" to={`/admin/results/${participant.resultId}`}>{participant.profileCode ?? participant.scoreTotal ?? formatTokenLabel(participant.scoreBand)}</Link> : '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDateTime(participant.startedAt)}</td>
                      <td className="px-4 py-4 text-slate-500">{formatDateTime(participant.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
