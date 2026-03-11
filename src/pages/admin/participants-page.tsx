import { Search } from 'lucide-react';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { participantRows } from '@/data/mock';

export function ParticipantsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Participants"
        title="Participant directory"
        description="Search and monitor participant identities, assigned tests, and completion status."
      />
      <Card className="bg-white/80">
        <CardContent className="p-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search participant name" />
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Participant</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {participantRows.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">{participant.fullName}</p>
                        <p className="text-slate-500">{participant.position}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{participant.department}</td>
                    <td className="px-4 py-4 text-slate-500">{participant.testType}</td>
                    <td className="px-4 py-4"><Badge>{participant.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
