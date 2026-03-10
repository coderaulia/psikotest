import { ArrowUpRight, CalendarRange, Users } from 'lucide-react';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardMetrics, resultRows, sessionRows } from '@/data/mock';

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="Assessment overview"
        description="Track active sessions, completions, and recent outcomes from a single premium workspace."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.label} className="bg-white/80">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-4xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500">{metric.meta}</CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Live sessions</CardTitle>
            <CardDescription>Session health, delivery status, and participant completion snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionRows.map((session) => (
              <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{session.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{session.testType} assessment</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Badge>{session.status}</Badge>
                  <span>{session.completed}/{session.participants} completed</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Recent completions</CardTitle>
            <CardDescription>Latest participants who finished an assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultRows.map((result) => (
              <div key={result.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{result.participantName}</p>
                    <p className="mt-1 text-sm text-slate-500">{result.summary}</p>
                  </div>
                  <Badge>{result.testType}</Badge>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2 text-sm text-slate-500">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <Users className="mb-3 h-4 w-4" />
                94 completed assessments
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <CalendarRange className="mb-3 h-4 w-4" />
                12 scheduled sessions
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
