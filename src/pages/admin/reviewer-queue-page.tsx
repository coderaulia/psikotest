import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { StateCard } from '@/components/common/state-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadAdminSession } from '@/lib/admin-session';
import { formatDateTime, formatResultSummary, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';
import { fetchReviewerQueue } from '@/services/admin-data';
import type { StoredResultRecord } from '@/types/assessment';

export function ReviewerQueuePage() {
  const adminSession = loadAdminSession();
  const canReview = ['super_admin', 'psychologist_reviewer'].includes(adminSession?.admin.role ?? '');
  const [items, setItems] = useState<StoredResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadQueue() {
    if (!canReview) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setItems(await fetchReviewerQueue());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reviewer queue');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  if (!canReview) {
    return <StateCard title="Reviewer access required" description="Only psychologist reviewers and super admins can access the report review queue." tone="danger" />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Reviewer Queue"
        title="Pending report review"
        description="Results that still need professional review or formal release."
      />

      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          {isLoading ? (
            <StateCard title="Loading queue" description="Preparing reviewer-ready assessment outcomes." />
          ) : error ? (
            <StateCard title="Queue unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadQueue()} />
          ) : items.length === 0 ? (
            <StateCard title="Queue clear" description="There are no pending review items right now." />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-950">{item.participantName}</p>
                        <Badge>{formatTestTypeLabel(item.testType)}</Badge>
                        <Badge>{formatTokenLabel(item.reviewStatus)}</Badge>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
