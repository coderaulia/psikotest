import { Filter, Search } from 'lucide-react';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resultRows } from '@/data/mock';

export function ResultsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Results"
        title="Assessment results"
        description="Search by participant, filter by test type, and open result details for review-ready reporting."
      />
      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input className="pl-10" placeholder="Search participant" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
              <Filter className="h-4 w-4" />
              All test types
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Participant</th>
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {resultRows.map((result) => (
                  <tr key={result.id}>
                    <td className="px-4 py-4 font-medium text-slate-950">{result.participantName}</td>
                    <td className="px-4 py-4"><Badge>{result.testType}</Badge></td>
                    <td className="px-4 py-4 text-slate-500">{result.summary}</td>
                    <td className="px-4 py-4 text-slate-950">{result.score}</td>
                    <td className="px-4 py-4 text-slate-500">{result.date}</td>
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
