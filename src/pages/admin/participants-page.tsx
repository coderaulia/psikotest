import { useDeferredValue, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchParticipants } from '@/services/admin-data';
import type { ParticipantListItem } from '@/types/assessment';
import { formatDateTime, formatStatusLabel, formatTestTypeLabel } from '@/lib/formatters';

export function ParticipantsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadParticipants() {
    setIsLoading(true);
    setError(null);

    try {
      setParticipants(await fetchParticipants(deferredSearch.trim()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load participants');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadParticipants();
  }, [deferredSearch]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Participants"
        title="Participant directory"
        description="Search and monitor participant identities, latest assigned tests, and completion status."
      />
      <Card className="bg-white/80">
        <CardContent className="p-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search participant name or department" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {isLoading ? (
              <div className="p-6">
                <StateCard title="Loading participants" description="Pulling the latest participant directory from MySQL." />
              </div>
            ) : error ? (
              <div className="p-6">
                <StateCard title="Participants unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadParticipants()} />
              </div>
            ) : participants.length === 0 ? (
              <div className="p-6">
                <StateCard title="No participants found" description="Participants will appear here once someone starts an assessment." />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Participant</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Latest Test</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-950">{participant.fullName}</p>
                          <p className="text-slate-500">{participant.positionTitle ?? participant.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{participant.department ?? '-'}</td>
                      <td className="px-4 py-4 text-slate-500">{formatTestTypeLabel(participant.latestTestType)}</td>
                      <td className="px-4 py-4"><Badge>{formatStatusLabel(participant.latestStatus)}</Badge></td>
                      <td className="px-4 py-4 text-slate-500">{formatDateTime(participant.lastActivityAt)}</td>
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
