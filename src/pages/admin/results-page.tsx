import { Filter, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchResults } from '@/services/admin-data';
import type { ResultReviewStatus, StoredResultRecord, TestTypeCode } from '@/types/assessment';
import { formatDate, formatResultHeadline, formatResultSummary, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

function renderAudienceSummary(result: StoredResultRecord) {
  return `Participant: ${formatTokenLabel(result.participantResultAccess)} · HR: ${formatTokenLabel(result.hrResultAccess)}`;
}

export function ResultsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [testType, setTestType] = useState<'all' | TestTypeCode>('all');
  const [reviewStatus, setReviewStatus] = useState<'all' | ResultReviewStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<StoredResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadResults() {
    setIsLoading(true);
    setError(null);

    try {
      setResults(
        await fetchResults({
          search: deferredSearch.trim(),
          testType,
          reviewStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load results');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadResults();
  }, [deferredSearch, testType, reviewStatus, dateFrom, dateTo]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Results"
        title="Assessment results"
        description="Search by participant, filter by test type or review state, and inspect release visibility before any report leaves the platform."
      />
      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input className="pl-10" placeholder="Search participant or session" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-4 xl:w-[760px]">
              <Select value={testType} onChange={(event) => setTestType(event.target.value as 'all' | TestTypeCode)}>
                <option value="all">All test types</option>
                <option value="disc">DISC</option>
                <option value="iq">IQ</option>
                <option value="workload">Workload</option>
                <option value="custom">Custom Research</option>
              </Select>
              <Select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as 'all' | ResultReviewStatus)}>
                <option value="all">All review states</option>
                <option value="scored_preliminary">Preliminary</option>
                <option value="in_review">In review</option>
                <option value="reviewed">Reviewed</option>
                <option value="released">Released</option>
              </Select>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            {results.length} result{results.length === 1 ? '' : 's'}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            {isLoading ? (
              <div className="p-6">
                <StateCard title="Loading results" description="Pulling scored assessments and visibility policies from MySQL." />
              </div>
            ) : error ? (
              <div className="p-6">
                <StateCard title="Results unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadResults()} />
              </div>
            ) : results.length === 0 ? (
              <div className="p-6">
                <StateCard title="No results found" description="Scored results will appear here once participants complete an assessment." />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Participant</th>
                    <th className="px-4 py-3 font-medium">Test</th>
                    <th className="px-4 py-3 font-medium">Review</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                    <th className="px-4 py-3 font-medium">Summary</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white align-top">
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-4 py-4 font-medium text-slate-950">
                        <Link className="underline-offset-4 hover:underline" to={`/admin/results/${result.id}`}>
                          {result.participantName}
                        </Link>
                        <p className="mt-1 text-xs font-normal uppercase tracking-[0.18em] text-slate-400">{result.sessionTitle}</p>
                      </td>
                      <td className="px-4 py-4"><Badge>{formatTestTypeLabel(result.testType)}</Badge></td>
                      <td className="px-4 py-4"><Badge>{formatTokenLabel(result.reviewStatus)}</Badge></td>
                      <td className="px-4 py-4 text-slate-500">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{formatTokenLabel(result.distributionPolicy)}</Badge>
                          {result.protectedDeliveryMode ? <Badge>Protected delivery</Badge> : null}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{renderAudienceSummary(result)}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        <p>{formatResultSummary({
                          testType: result.testType,
                          primaryType: result.primaryType,
                          secondaryType: result.secondaryType,
                          scoreBand: result.scoreBand,
                        })}</p>
                        <p className="mt-2 text-sm font-medium text-slate-950">{formatResultHeadline({
                          testType: result.testType,
                          primaryType: result.primaryType,
                          secondaryType: result.secondaryType,
                          profileCode: result.profileCode,
                          scoreBand: result.scoreBand,
                          scoreTotal: result.scoreTotal,
                        })}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(result.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
