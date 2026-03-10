import { ArrowRight, Brain, ChartColumn, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { landingFeatures, sessionRows } from '@/data/mock';

const testCategories = [
  {
    title: 'IQ Assessment',
    description: 'Timed multiple-choice cognitive tests with scalable scoring and interpretation bands.',
    icon: Brain,
  },
  {
    title: 'DISC Personality',
    description: 'Forced-choice personality profiling with D, I, S, and C breakdowns plus profile summaries.',
    icon: ClipboardCheck,
  },
  {
    title: 'Workload Assessment',
    description: 'Likert-based workload measurement covering demand, pressure, stress, and fatigue.',
    icon: ChartColumn,
  },
];

const benefitCards = [
  'Structured participant flow with identity capture and session tokens',
  'Admin-friendly dashboard for monitoring completion and reviewing results',
  'Prepared reporting modules for future PDF export and email distribution',
  'Flexible question bank architecture for adding more personality tools later',
];

export function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Premium assessment workflow for modern teams
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Calm, premium psychological testing for hiring and employee development.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-500">
                Launch IQ, DISC, and workload assessments from one polished platform with a participant flow that feels simple and a dashboard that feels operationally clean.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2">
                Start Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/admin/login">Open Admin Console</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {landingFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/70 bg-white/75 px-5 py-4 text-sm text-slate-600 shadow-sm backdrop-blur">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <Card className="border-white/80 bg-white/80">
            <CardHeader>
              <CardTitle>Assessment command center</CardTitle>
              <CardDescription>
                A soft, macOS-inspired workspace for session orchestration and reporting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionRows.map((session) => (
                <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{session.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{session.testType} assessment</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>{session.participants} participants</span>
                    <span>{session.completed} completed</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="overview" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Overview"
          title="Built for HR, psychologists, and people teams"
          description="The MVP focuses on a clean delivery flow, modular scoring, and report-ready results without dragging you into enterprise complexity too early."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="bg-white/85">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="pt-4">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="tests" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Benefits"
          title="Operationally simple, visually composed"
          description="The platform keeps your workflows clean with reusable sessions, polished participant screens, and prepared reporting modules."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {benefitCards.map((item) => (
            <Card key={item} className="bg-white/80">
              <CardContent className="p-6 text-sm leading-7 text-slate-600">{item}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">Simple Pricing Placeholder</p>
              <h2 className="text-3xl font-semibold tracking-tight">Start with one calm assessment workspace.</h2>
              <p className="max-w-xl text-sm leading-7 text-white/70">
                Launch the MVP with public landing, participant sessions, admin reporting, and scalable schema foundations. Add exports, PDF reports, and advanced question banks in later iterations.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm text-white/60">Starter</p>
              <p className="mt-3 text-5xl font-semibold">Custom</p>
              <p className="mt-3 text-sm text-white/70">Price placeholder for implementation and hosting package discussion.</p>
              <Button variant="secondary" size="lg" className="mt-6 w-full justify-center bg-white text-slate-950 hover:bg-white/90">
                Schedule Planning
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
