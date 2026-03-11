import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { saveParticipantConsent, loadParticipantSession } from '@/lib/participant-session';
import { formatTokenLabel } from '@/lib/formatters';
import { fetchPublicSession } from '@/services/public-sessions';
import type { PublicSessionResponse } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ParticipantConsentPage() {
  const { token = 'assessment-token' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PublicSessionResponse | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSession = loadParticipantSession(token);

    if (storedSession?.result) {
      navigate(`/t/${token}/completed`, { replace: true });
      return;
    }

    if (storedSession) {
      navigate(`/t/${token}/instructions`, { replace: true });
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
          setError(requestError instanceof Error ? requestError.message : 'Unable to load consent details');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  function handleContinue() {
    const consentAcceptedAt = new Date().toISOString();
    saveParticipantConsent(token, { consentAcceptedAt });
    navigate(`/t/${token}/identity`);
  }

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
        <CardContent className="p-8 text-sm text-slate-500">Loading assessment consent...</CardContent>
      </Card>
    );
  }

  const { compliance } = session.session;

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82">
      <CardHeader>
        <CardTitle>Assessment consent</CardTitle>
        <CardDescription>
          Review the assessment purpose, administration context, and privacy notice before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Purpose</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(compliance.assessmentPurpose)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Administration</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(compliance.administrationMode)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Interpretation</p>
            <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(compliance.interpretationMode)}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-600">
          <div>
            <p className="font-medium text-slate-950">Purpose statement</p>
            <p className="mt-1">{compliance.consentStatement}</p>
          </div>
          <div>
            <p className="font-medium text-slate-950">Privacy statement</p>
            <p className="mt-1">{compliance.privacyStatement}</p>
          </div>
          <div>
            <p className="font-medium text-slate-950">Voluntary participation</p>
            <p className="mt-1">Participation should be based on informed consent. Contact the listed person if you need clarification before starting.</p>
          </div>
          <div>
            <p className="font-medium text-slate-950">Contact person</p>
            <p className="mt-1">{compliance.contactPerson}</p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>I agree to participate in this psychological assessment and understand the purpose, confidentiality terms, and review process described above.</span>
        </label>

        <div className="flex justify-end">
          <Button type="button" disabled={!agreed} onClick={handleContinue}>
            Continue to identity form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
