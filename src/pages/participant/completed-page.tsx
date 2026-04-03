import { Link, useParams } from 'react-router-dom';

import { formatTokenLabel } from '@/lib/formatters';
import { useLanguage } from '@/lib/language';
import { loadParticipantSession } from '@/lib/participant-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function getReviewStatusMessage(reviewStatus: string | null | undefined, language: 'en' | 'id') {
  if (reviewStatus === 'reviewed') {
    return language === 'id'
      ? 'Hasilmu sudah direview dan lagi menunggu rilis resmi.'
      : 'Your result has been reviewed and is awaiting authorized release.';
  }

  if (reviewStatus === 'in_review') {
    return language === 'id'
      ? 'Jawabanmu lagi direview oleh psikolog atau reviewer yang berwenang.'
      : 'Your responses are currently being reviewed by an authorized psychologist or reviewer.';
  }

  return language === 'id'
    ? 'Jawabanmu sudah terekam. Interpretasi final akan tersedia setelah reviewer berwenang menyelesaikan review dan merilis hasil.'
    : 'Your responses have been recorded. Final interpretation will be available after an authorized reviewer completes the assessment review and release.';
}

const copy = {
  en: {
    title: 'Assessment completed',
    description: 'Your responses have been submitted successfully.',
    participantFallback: 'Participant',
    responseRecordedTag: 'Response recorded',
    responseRecordedBody: 'Your response has been recorded. Thank you for participating.',
    reviewStatusTag: 'Review status',
    reviewRequired: 'Professional review required',
    primaryResult: 'Primary result',
    interpretation: 'Interpretation',
    noSummary: 'Result summary is not available yet.',
    recommendation: 'Recommendation',
    limitations: 'Limitations',
    returnHome: 'Return to home',
  },
  id: {
    title: 'Asesmen selesai',
    description: 'Jawabanmu berhasil dikirim.',
    participantFallback: 'Peserta',
    responseRecordedTag: 'Jawaban terekam',
    responseRecordedBody: 'Jawabanmu sudah terekam. Terima kasih sudah berpartisipasi.',
    reviewStatusTag: 'Status review',
    reviewRequired: 'Perlu review profesional',
    primaryResult: 'Hasil utama',
    interpretation: 'Interpretasi',
    noSummary: 'Ringkasan hasil belum tersedia.',
    recommendation: 'Rekomendasi',
    limitations: 'Batasan interpretasi',
    returnHome: 'Kembali ke beranda',
  },
} as const;

export function ParticipantCompletedPage() {
  const { token = 'assessment-token' } = useParams();
  const { language } = useLanguage();
  const t = copy[language];

  const storedSession = loadParticipantSession(token);
  const result = storedSession?.result;
  const note = typeof result?.resultPayload.note === 'string' ? result.resultPayload.note : null;

  const participantResultAccess = storedSession?.compliance?.participantResultAccess ?? 'summary';
  const isReviewRequired = storedSession?.participantResultMode === 'review_required' && result?.reviewStatus !== 'released';
  const isNoAccess = participantResultAccess === 'none';
  const isFullReleasedPending = participantResultAccess === 'full_released' && result?.reviewStatus !== 'released';
  const shouldHideResult = isNoAccess || isReviewRequired || isFullReleasedPending;

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82 text-center">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-left text-sm leading-7 text-slate-500">
          <p className="font-medium text-slate-950">{storedSession?.participant.fullName ?? t.participantFallback}</p>

          {isNoAccess ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">{t.responseRecordedTag}</p>
              <p className="mt-2 text-sm text-slate-600">{t.responseRecordedBody}</p>
            </div>
          ) : isReviewRequired || isFullReleasedPending ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.reviewStatusTag}</p>
              <p className="mt-2 text-base font-medium text-slate-950">{t.reviewRequired}</p>
              <p className="mt-2 text-sm text-slate-500">{getReviewStatusMessage(result?.reviewStatus, language)}</p>
            </div>
          ) : result ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.primaryResult}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{result.profileCode ?? result.scoreTotal ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.interpretation}</p>
                <p className="mt-2 text-base font-medium text-slate-950">
                  {result.professionalSummary ?? formatTokenLabel(result.scoreBand ?? result.interpretationKey)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4">{t.noSummary}</p>
          )}
        </div>

        {!shouldHideResult && result ? (
          <>
            <div className="grid gap-3 text-left md:grid-cols-2">
              {result.summaries.map((summary) => (
                <div key={summary.metricKey} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-950">{summary.metricLabel}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.score}</p>
                  {summary.band ? <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{formatTokenLabel(summary.band)}</p> : null}
                </div>
              ))}
            </div>

            {result.recommendation || result.limitations ? (
              <div className="grid gap-3 text-left md:grid-cols-2">
                {result.recommendation ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    <p className="font-medium text-slate-950">{t.recommendation}</p>
                    <p className="mt-2">{result.recommendation}</p>
                  </div>
                ) : null}
                {result.limitations ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    <p className="font-medium text-slate-950">{t.limitations}</p>
                    <p className="mt-2">{result.limitations}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {note ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">{note}</div>
        ) : null}

        <Button variant="secondary" asChild>
          <Link to="/">{t.returnHome}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
