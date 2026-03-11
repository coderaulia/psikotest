import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { loadParticipantSession } from '@/lib/participant-session';
import { formatTokenLabel } from '@/lib/formatters';
import { fetchPublicSession } from '@/services/public-sessions';
import type { PublicSessionResponse } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ParticipantInstructionsPage() {
  const { token = 'assessment-token' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PublicSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadParticipantSession(token)) {
      navigate(`/t/${token}/identity`, { replace: true });
      return;
    }

    let isMounted = true;

    void fetchPublicSession(token)
      .then((payload) => {
        if (isMounted) {
          setSession(payload);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load instructions');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-3xl bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{error}</CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="mx-auto w-full max-w-3xl bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading session instructions...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82">
      <CardHeader>
        <CardTitle>{session.session.title}</CardTitle>
        <CardDescription>
          {session.session.testType.toUpperCase()} assessment • Estimated duration {session.session.estimatedMinutes} minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Purpose</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.session.compliance.assessmentPurpose)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Administration</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.session.compliance.administrationMode)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Result Mode</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.session.compliance.participantResultMode)}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-600">
          {session.session.instructions.map((instruction) => (
            <p key={instruction}>{instruction}</p>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Automated scoring in this MVP is indicative only. {session.session.compliance.interpretationMode === 'professional_review'
            ? 'Final interpretation will be available after professional review.'
            : 'Use the result as a self-assessment indicator, not as a clinical conclusion.'}
        </div>

        <div className="flex justify-end">
          <Button asChild>
            <Link to={`/t/${token}/test`}>Start test</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
