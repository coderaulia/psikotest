import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { loadAdminSession } from '@/lib/admin-session';
import { fetchResultDetail, updateAdminResultReview } from '@/services/admin-data';
import type { ResultReviewStatus, StoredResultDetailRecord } from '@/types/assessment';
import {
  formatDateTime,
  formatResultHeadline,
  formatResultSummary,
  formatTestTypeLabel,
  formatTokenLabel,
} from '@/lib/formatters';

interface ReviewFormState {
  professionalSummary: string;
  recommendation: string;
  limitations: string;
  reviewerNotes: string;
}

function createFormState(result: StoredResultDetailRecord): ReviewFormState {
  return {
    professionalSummary: result.professionalSummary ?? '',
    recommendation: result.recommendation ?? '',
    limitations: result.limitations ?? '',
    reviewerNotes: result.reviewerNotes ?? '',
  };
}

export function ResultDetailPage() {
  const { id } = useParams();
  const resultId = Number(id);
  const adminSession = loadAdminSession();
  const canReview = ['super_admin', 'psychologist_reviewer'].includes(adminSession?.admin.role ?? '');
  const [result, setResult] = useState<StoredResultDetailRecord | null>(null);
  const [form, setForm] = useState<ReviewFormState>({
    professionalSummary: '',
    recommendation: '',
    limitations: '',
    reviewerNotes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadResult() {
    setIsLoading(true);
    setError(null);

    try {
      const record = await fetchResultDetail(resultId);
      setResult(record);
      setForm(createFormState(record));
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

  async function saveReview(reviewStatus?: ResultReviewStatus) {
    if (!result || !canReview) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const nextStatus = reviewStatus
        ?? (result.reviewStatus === 'scored_preliminary' ? 'in_review' : undefined);
      const updated = await updateAdminResultReview(result.id, {
        reviewStatus: nextStatus,
        professionalSummary: form.professionalSummary,
        recommendation: form.recommendation,
        limitations: form.limitations,
        reviewerNotes: form.reviewerNotes,
      });
      setResult(updated);
      setForm(createFormState(updated));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save review changes');
    } finally {
      setIsSaving(false);
    }
  }

  if (!Number.isFinite(resultId)) {
    return <StateCard title="Invalid result" description="The requested result id is not valid." tone="danger" />;
  }

  if (isLoading && !result) {
    return <StateCard title="Loading result" description="Pulling participant details and reviewer workflow data." />;
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
        description={`${formatTestTypeLabel(result.testType)} assessment • ${formatDateTime(result.submittedAt)}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild><Link to={`/admin/test-sessions/${result.session.id}`}>Open session</Link></Button>
            {canReview ? (
              <>
                <Button variant="outline" onClick={() => void saveReview('scored_preliminary')} disabled={isSaving}>
                  Reset to preliminary
                </Button>
                <Button variant="secondary" onClick={() => void saveReview()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save review draft'}
                </Button>
                <Button variant="secondary" onClick={() => void saveReview('reviewed')} disabled={isSaving}>
                  Mark reviewed
                </Button>
                <Button onClick={() => void saveReview('released')} disabled={isSaving}>
                  Release report
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {!canReview ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          This result is read-only for your role. Reviewer actions are limited to psychologist reviewers and super admins.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            <CardDescription>Review status</CardDescription>
            <CardTitle><Badge>{formatTokenLabel(result.reviewStatus)}</Badge></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Reviewed At</CardDescription>
            <CardTitle>{result.reviewedAt ? formatDateTime(result.reviewedAt) : '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardDescription>Released At</CardDescription>
            <CardTitle>{result.releasedAt ? formatDateTime(result.releasedAt) : '-'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reviewer Assigned</p><p className="mt-2 font-medium text-slate-950">{result.reviewerAdminId ?? '-'}</p></div>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Professional interpretation</CardTitle>
            <CardDescription>Reviewer-facing narrative that separates professional output from machine scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-950">Professional summary</p>
              <Textarea disabled={!canReview} value={form.professionalSummary} onChange={(event) => setForm((current) => ({ ...current, professionalSummary: event.target.value }))} placeholder="Write the reviewed interpretation summary." />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-950">Recommendation</p>
              <Textarea disabled={!canReview} value={form.recommendation} onChange={(event) => setForm((current) => ({ ...current, recommendation: event.target.value }))} placeholder="Add role-fit or follow-up recommendation." />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-950">Limitations</p>
              <Textarea disabled={!canReview} value={form.limitations} onChange={(event) => setForm((current) => ({ ...current, limitations: event.target.value }))} placeholder="Record constraints, caveats, or validity notes." />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Reviewer notes</CardTitle>
            <CardDescription>Internal notes and workflow context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-950">Internal reviewer notes</p>
              <Textarea disabled={!canReview} value={form.reviewerNotes} onChange={(event) => setForm((current) => ({ ...current, reviewerNotes: event.target.value }))} placeholder="Capture reviewer observations, follow-ups, or release notes." />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Review started</p>
                <p className="mt-2 font-medium text-slate-950">{result.reviewStartedAt ? formatDateTime(result.reviewStartedAt) : '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Released by</p>
                <p className="mt-2 font-medium text-slate-950">{result.releasedByAdminId ?? '-'}</p>
              </div>
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
