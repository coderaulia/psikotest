import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const revealTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

interface ManualTrack {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  steps: Array<{ step: string; title: string; detail: string }>;
  checklist: string[];
}

const publicFlowTrack: ManualTrack = {
  id: 'public-flow',
  label: 'Public Test Flow',
  title: 'How anyone can start a test immediately',
  description:
    'The public flow is the fastest way to experience the assessment engine. It skips the workspace setup and manual invitation steps.',
  icon: Sparkles,
  accentClass:
    'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
  steps: [
    {
      step: '01',
      title: 'Visit Landing Page',
      detail: 'Go to the homepage and browse the available public assessments.',
    },
    {
      step: '02',
      title: 'Choose Your Test',
      detail: 'Pick between DISC, IQ, or Workload assessment based on your interest.',
    },
    {
      step: '03',
      title: 'Enter Identity',
      detail: 'Provide your name and email. This links your progress to your identity for the final result.',
    },
    {
      step: '04',
      title: 'Answer the Assessment',
      detail: 'Follow the instructions and complete the test within the time limit.',
    },
    {
      step: '05',
      title: 'View Your Result',
      detail: 'Get an immediate basic summary or access a more detailed report for deeper insights.',
    },
  ],
  checklist: [
    'Available tests: DISC, IQ, Workload',
    'Free version: Basic summary',
    'Full version: Detailed report & interpretation',
    'Need company features? Go to /saas',
    'Need branding? Go to /white-label',
  ],
};

const manualTracks: ManualTrack[] = [
  publicFlowTrack,
  {
    id: 'super-admin',
    label: 'Platform Manager Guide',
    title: 'How a Super Admin operates the SaaS',
    description:
      'Super admins oversee the entire platform, managing settings, monitoring registered customers, and ensuring smooth operation across all workspaces.',
    icon: ShieldCheck,
    accentClass:
      'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,252,232,0.94)_58%,rgba(254,249,195,0.76))]',
    steps: [
      {
        step: '01',
        title: 'Sign in to the Admin Console',
        detail: 'Log into the protected admin workflow (separate from customer workspace) using authorized credentials.',
      },
      {
        step: '02',
        title: 'Manage Customer Accounts',
        detail: 'Access the dedicated Customers tab to view all signed-up companies and researchers. Monitor assessment volume and last login activity.',
      },
      {
        step: '03',
        title: 'Activate or Deactivate Workspaces',
        detail: 'Control platform access with one-click toggles to activate or deactivate customer accounts (e.g., for billing or compliance reasons).',
      },
      {
        step: '04',
        title: 'Configure Global Settings',
        detail: 'Set default session templates, system limits, and review the global audit trail across all platform activity.',
      },
      {
        step: '05',
        title: 'Monitor the Reviewer Queue',
        detail: 'Like psychologist reviewers, super admins can access the reviewer queue to help reassign or unblock assessments.',
      },
    ],
    checklist: ['Keep admin credentials strictly secure', 'Review the audit log regularly', 'Communicate any workspace deactivations to customers'],
  },
  {
    id: 'participant',
    label: 'Participant Guide',
    title: 'How participants move through an assessment',
    description:
      'The participant flow is designed to be calm, guided, and compliant. Each assessment starts with context before identity and question delivery.',
    icon: Users,
    accentClass:
      'border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96)_58%,rgba(219,234,254,0.78))]',
    steps: [
      {
        step: '01',
        title: 'Open the participant link',
        detail: 'Participants receive a private assessment link from the company, researcher, or reviewer in charge of the session.',
      },
      {
        step: '02',
        title: 'Read consent and privacy information',
        detail: 'Before anything else, the platform shows the purpose of the assessment, data usage, and the responsible contact person.',
      },
      {
        step: '03',
        title: 'Complete the identity form',
        detail: 'Participants fill in the required personal details such as name, email, department, or study identifier, depending on the session configuration.',
      },
      {
        step: '04',
        title: 'Review instructions and answer the test',
        detail: 'The app presents timing and answering guidance first, then delivers the assessment itself in a structured flow.',
      },
      {
        step: '05',
        title: 'Submit and wait for the result policy',
        detail: 'Some sessions show an instant summary, while review-required sessions wait for the psychologist or reviewer to release the final interpretation.',
      },
    ],
    checklist: ['Use a stable internet connection', 'Read the consent statement fully', 'Avoid refreshing during the test'],
  },
  {
    id: 'company',
    label: 'Company and Research Workspace',
    title: 'How a company or researcher runs assessments',
    description:
      'Organizations and researchers use the workspace flow to create an assessment draft, preview it, and activate distribution only when it is ready.',
    icon: Building2,
    accentClass:
      'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
    steps: [
      {
        step: '01',
        title: 'Create a workspace',
        detail: 'Sign up as a business or researcher, then access the workspace where assessments, sessions, and results are managed.',
      },
      {
        step: '02',
        title: 'Create the first assessment',
        detail: 'Choose IQ, DISC, workload, or a custom research instrument, then define the purpose, organization name, and use case.',
      },
      {
        step: '03',
        title: 'Configure settings',
        detail: 'Set time limits, participant caps, administration mode, and result visibility before generating the participant link.',
      },
      {
        step: '04',
        title: 'Preview the participant journey',
        detail: 'Review the consent page, identity form, instructions, and testing flow before changing the draft into a live session.',
      },
      {
        step: '05',
        title: 'Activate sharing and monitor results',
        detail: 'Once ready, activate the session, distribute the participant link, then monitor submissions, progress, and results from the dashboard.',
      },
    ],
    checklist: ['Confirm result visibility policy', 'Review consent language', 'Validate participant limits before launch'],
  },
  {
    id: 'psychologist',
    label: 'Psychologist and Reviewer Guide',
    title: 'How reviewers handle professional interpretation',
    description:
      'Review-required sessions separate preliminary scoring from the final released interpretation so reviewer decisions stay explicit and traceable.',
    icon: Stethoscope,
    accentClass:
      'border-violet-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94)_58%,rgba(233,213,255,0.62))]',
    steps: [
      {
        step: '01',
        title: 'Open the reviewer queue',
        detail: 'Reviewers can see newly scored sessions that require professional handling before they are released to the final audience.',
      },
      {
        step: '02',
        title: 'Inspect the participant and session context',
        detail: 'The result detail shows participant metadata, session information, score summaries, and structured breakdowns.',
      },
      {
        step: '03',
        title: 'Draft professional interpretation',
        detail: 'Add summary notes, recommendations, limitations, and reviewer comments as part of the review workflow.',
      },
      {
        step: '04',
        title: 'Mark reviewed and release',
        detail: 'Once interpretation is finalized, move the result through reviewed and released states so the right audience can access the correct report version.',
      },
      {
        step: '05',
        title: 'Audit and follow up',
        detail: 'The platform keeps review status and release actions traceable for operational and compliance follow-up.',
      },
    ],
    checklist: ['Review before release', 'Keep limitations explicit', 'Use the release state intentionally'],
  },
];

const supportNotes = [
  {
    title: 'Result visibility depends on the session policy',
    description: 'Instant-summary sessions behave differently from review-required sessions. Participants and organizations should confirm which mode is active before distribution.',
    icon: ShieldCheck,
  },
  {
    title: 'Participant links should stay private',
    description: 'Assessment links are intended for the target participants only. Keep them inside the planned hiring, education, or research workflow.',
    icon: ClipboardCheck,
  },
  {
    title: 'Manual + workflow should be used together',
    description: 'This guide explains how the app works operationally. Assessment content quality, reviewer standards, and institutional compliance still need responsible handling.',
    icon: BookOpen,
  },
];

function MotionSection({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={revealTransition}
    >
      {children}
    </motion.section>
  );
}

export function ManualPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        <div className="absolute left-[8%] top-12 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-emerald-100/55 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.05 }}
            className="space-y-7"
          >
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">Product Manual</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.95]">
                A practical guide for participants, companies, and psychologists.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                This manual explains how each role uses the platform, from opening a participant link to reviewing and releasing a professional report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {manualTracks.map((track) => (
                <a
                  key={track.id}
                  href={`#${track.id}`}
                  className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                >
                  {track.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Create Workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/white-label">Explore White-label</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...revealTransition, delay: 0.14 }}
            className="grid gap-4"
          >
            <Card className="overflow-hidden border-white/80 bg-white/86 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100/80">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Role overview</p>
                <CardTitle className="text-2xl">Four operational tracks</CardTitle>
                <CardDescription className="text-sm leading-7 text-slate-600">
                  The app is used differently depending on whether someone is taking an assessment, managing distribution, or reviewing results professionally.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-6">
                {manualTracks.map((track, index) => {
                  const Icon = track.icon;
                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...revealTransition, delay: 0.18 + index * 0.08 }}
                      className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50/90 px-4 py-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-slate-950">{track.label}</p>
                        <p className="text-sm leading-7 text-slate-600">{track.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow="Usage tracks"
          title="Choose the workflow that matches your role"
          description="Each audience uses the same platform differently, so the manual is organized by the operational journey, not by feature list alone."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {manualTracks.map((track, index) => {
            const Icon = track.icon;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className={`h-full ${track.accentClass}`}>
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{track.label}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-slate-600">{track.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={`#${track.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                      Open guide <ArrowRight className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      {manualTracks.map((track, trackIndex) => {
        const Icon = track.icon;

        return (
          <MotionSection key={track.id} id={track.id} className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <Card className={`${track.accentClass} overflow-hidden`}>
                <CardContent className="space-y-6 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{track.label}</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{track.title}</h2>
                    <p className="text-sm leading-7 text-slate-600">{track.description}</p>
                  </div>
                  <div className="rounded-[28px] border border-white/80 bg-white/84 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recommended checklist</p>
                    <div className="mt-4 space-y-3">
                      {track.checklist.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {track.steps.map((step, stepIndex) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ ...revealTransition, delay: stepIndex * 0.06 }}
                  >
                    <Card className={`border-slate-200/80 bg-white/88 ${trackIndex === 2 ? 'shadow-[0_24px_72px_-56px_rgba(76,29,149,0.32)]' : ''}`}>
                      <CardContent className="flex gap-5 p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                          {step.step}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-medium text-slate-950">{step.title}</h3>
                          <p className="text-sm leading-7 text-slate-600">{step.detail}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </MotionSection>
        );
      })}

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow="Operational notes"
          title="Important usage guidance before wider rollout"
          description="These notes help teams align platform usage with internal process, reviewer standards, and participant communication."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {supportNotes.map((note, index) => {
            const Icon = note.icon;
            return (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="h-full border-slate-200/80 bg-white/88">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-600">{note.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Need a branded deployment?</p>
              <h2 className="text-3xl font-semibold tracking-tight">Use the same platform as your own operational experience.</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                If you need a private, branded version for a company, consultant practice, or research lab, the white-label model lets the platform adapt to your identity and operating workflow.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" className="justify-center bg-white text-slate-950 hover:bg-white/90" asChild>
                <Link to="/white-label">See White-label</Link>
              </Button>
              <Button size="lg" className="justify-center border border-white/15 bg-white/10 text-white hover:bg-white/15" asChild>
                <Link to="/signup">Start With SaaS</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}
