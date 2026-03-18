import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { StateCard } from '@/components/common/state-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loadAdminSession } from '@/lib/admin-session';
import { formatDateTime, formatResultSummary, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';
import { fetchReviewerQueue, fetchReviewerQueueSummary } from '@/services/admin-data';
import type { ReviewerQueueScope, ReviewerQueueSummary, StoredResultRecord } from '@/types/assessment';

const emptySummary: ReviewerQueueSummary = {
  pendingCount: 0,
  unassignedCount: 0,
  assignedToMeCount: 0,
  inReviewCount: 0,
  readyForReleaseCount: 0,
};

export function ReviewerQueuePage() {
  const adminSession = loadAdminSession();
  const canReview = ['super_admin', 'psychologist_reviewer'].includes(adminSession?.admin.role ?? '');
  const defaultScope: ReviewerQueueScope = adminSession?.admin.role === 'super_admin' ? 'all' : 'mine';
  const [scope, setScope] = useState<ReviewerQueueScope>(defaultScope);
  const [items, setItems] = useState<StoredResultRecord[]>([]);
  const [summary, setSummary] = useState<ReviewerQueueSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopeOptions: Array<{ value: ReviewerQueueScope; label: string }> = adminSession?.admin.role === 'super_admin'
    ? [
        { value: 'all', label: 'All visible items' },
        { value: 'mine', label: 'Assigned to me' },
        { value: 'unassigned', label: 'Unassigned' },
      ]
    : [
        { value: 'mine', label: 'Assigned to me' },
        { value: 'unassigned', label: 'Unassigned' },
      ];

  async function loadQueue(nextScope: ReviewerQueueScope) {
    if (!canReview) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [queueItems, queueSummary] = await Promise.all([
        fetchReviewerQueue(nextScope),
        fetchReviewerQueueSummary(),
      ]);
      setItems(queueItems);
      setSummary(queueSummary);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reviewer queue');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue(scope);
  }, [scope]);

  if (!canReview) {
    return <StateCard title="Reviewer access required" description="Only psychologist reviewers and super admins can access the report review queue." tone="danger" />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Reviewer Queue"
        title="Pending report review"
        description="Results that still need professional review, assignment, or formal release."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-white/80"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pending</p><p className="mt-3 text-3xl font-semibold text-slate-950">{summary.pendingCount}</p></CardContent></Card>
        <Card className="bg-white/80"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Assigned To Me</p><p className="mt-3 text-3xl font-semibold text-slate-950">{summary.assignedToMeCount}</p></CardContent></Card>
        <Card className="bg-white/80"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Unassigned</p><p className="mt-3 text-3xl font-semibold text-slate-950">{summary.unassignedCount}</p></CardContent></Card>
        <Card className="bg-white/80"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">In Review</p><p className="mt-3 text-3xl font-semibold text-slate-950">{summary.inReviewCount}</p></CardContent></Card>
        <Card className="bg-white/80"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ready For Release</p><p className="mt-3 text-3xl font-semibold text-slate-950">{summary.readyForReleaseCount}</p></CardContent></Card>
      </div>

      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap gap-3">
            {scopeOptions.map((option) => (
              <Button
                key={option.value}
                variant={scope === option.value ? 'default' : 'secondary'}
                onClick={() => setScope(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <StateCard title="Loading queue" description="Preparing reviewer-ready assessment outcomes." />
          ) : error ? (
            <StateCard title="Queue unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadQueue(scope)} />
          ) : items.length === 0 ? (
            <StateCard title="Queue clear" description="There are no pending review items in this scope right now." />
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const assignmentLabel = item.reviewerAdminId === adminSession?.admin.id
                  ? 'Assigned to you'
                  : item.reviewerAdminId === null
                    ? 'Unassigned'
                    : `Assigned reviewer #${item.reviewerAdminId}`;

                return (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{item.participantName}</p>
                          <Badge>{formatTestTypeLabel(item.testType)}</Badge>
                          <Badge>{formatTokenLabel(item.reviewStatus)}</Badge>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{assignmentLabel}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{item.sessionTitle}</p>
                        <p className="text-sm text-slate-500">{formatResultSummary({
                          testType: item.testType,
                          primaryType: item.primaryType,
                          secondaryType: item.secondaryType,
                          scoreBand: item.scoreBand,
                        })}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-sm text-slate-500 lg:items-end">
                        <p>{formatDateTime(item.submittedAt)}</p>
                        <Button asChild>
                          <Link to={`/admin/results/${item.id}`}>Open review</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
