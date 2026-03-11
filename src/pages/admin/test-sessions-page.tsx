import { Copy, Plus } from 'lucide-react';

import { SectionHeading } from '@/components/common/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { sessionRows } from '@/data/mock';

export function TestSessionsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Sessions"
        title="Test session management"
        description="Create sessions, share access links, and track completions by assessment type."
        actions={<Button className="gap-2"><Plus className="h-4 w-4" /> New session</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {sessionRows.map((session) => (
          <Card key={session.id} className="bg-white/80">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{session.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{session.testType} • {session.status}</p>
                </div>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-medium text-slate-950">Participants</p>
                  <p className="mt-1">{session.participants}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-medium text-slate-950">Completed</p>
                  <p className="mt-1">{session.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
