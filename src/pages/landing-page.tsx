import type { ReactNode } from 'react';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Building2,
  ChartColumn,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IconCardItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

const revealTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

const problemPoints = [
  'Manual scoring and calculations',
  'Difficult participant management',
  'Slow result processing',
  'Limited reporting and insights',
];

const workflowSteps = [
  {
    step: '01',
    title: 'Start a workspace',
    description: 'Choose a company or research setup, then define the assessment purpose.',
    state: 'Customer signup',
  },
  {
    step: '02',
    title: 'Configure the first draft',
    description: 'Set timing, participant limits, visibility, and the link structure in one guided flow.',
    state: 'Draft setup',
  },
  {
    step: '03',
    title: 'Preview the participant journey',
    description: 'Check consent, identity capture, and question delivery before any public rollout.',
    state: 'Preview mode',
  },
  {
    step: '04',
    title: 'Activate sharing when ready',
    description: 'Move from private draft to live distribution only after the flow and content are reviewed.',
    state: 'Share control',
  },
];

const heroSignals = [
  'Consent-aware delivery',
  'Automated scoring',
  'Built for HR and research',
];

const heroModules = [
  'IQ screening',
  'DISC personality',
  'Workload and stress',
  'Custom research',
];

const assessmentTypes: IconCardItem[] = [
  {
    title: 'Cognitive Ability Assessment (IQ)',
    description: 'Evaluate logical reasoning, analytical ability, and problem solving capacity.',
    icon: Brain,
  },
  {
    title: 'DISC Personality Assessment',
    description: 'Understand behavioral style, communication approach, and work tendencies.',
    icon: ClipboardCheck,
  },
  {
    title: 'Workload and Stress Assessment',
    description: 'Measure perceived mental workload and work pressure.',
    icon: ChartColumn,
  },
  {
    title: 'Custom Psychological Research Tests',
    description: 'Build and run structured questionnaires or scale instruments for psychology research and academic data collection.',
    icon: FileText,
  },
];

const assessmentUseCases = [
  'Often used for recruitment screening and academic evaluation.',
  'Useful for recruitment, team development, and leadership assessment.',
  'Useful for organizational wellbeing programs and academic research.',
  'Suitable for undergraduate studies, thesis work, psychology experiments, and new scale development.',
];

const audienceCards: IconCardItem[] = [
  {
    title: 'HR Teams',
    description:
      'Evaluate candidates more efficiently before interviews. Understand personality patterns and cognitive ability as part of recruitment screening.',
    icon: Users,
  },
  {
    title: 'Universities and Lecturers',
    description:
      'Conduct structured psychological assessments for students and research participants without manual scoring.',
    icon: GraduationCap,
  },
  {
    title: 'Organizations and Institutions',
    description:
      'Use psychological insights to support employee development, team analysis, and organizational research.',
    icon: Building2,
  },
];

const ethicalWorkflowItems = [
  'Participant informed consent before starting an assessment',
  'Structured test administration',
  'Automated scoring and structured interpretation',
  'Secure storage of participant results',
];

const reportItems = [
  'Participant identity and assessment information',
  'Score summary',
  'Structured interpretation',
  'Optional recommendations',
];

const platformAdvantages: IconCardItem[] = [
  {
    title: 'Simple to Use',
    description: 'Create an assessment and start collecting results within minutes.',
    icon: CheckCircle2,
  },
  {
    title: 'Automated Scoring',
    description: 'Remove manual calculations and reduce the risk of scoring errors.',
    icon: ClipboardCheck,
  },
  {
    title: 'Scalable',
    description: 'Conduct assessments for small groups or large participant pools.',
    icon: Users,
  },
  {
    title: 'Accessible Anywhere',
    description: 'Participants can complete assessments through any modern device.',
    icon: ArrowRight,
  },
];

const securityItems: IconCardItem[] = [
  {
    title: 'Participant data is securely stored',
    description: 'Assessment records are handled as sensitive information across the workflow.',
    icon: ShieldCheck,
  },
  {
    title: 'Results are accessible only to authorized users',
    description: 'Administrators control who can review reports and exported results.',
    icon: LockKeyhole,
  },
  {
    title: 'Test materials remain protected from public distribution',
    description: 'Structured delivery helps keep assessment content inside the intended testing flow.',
    icon: FileText,
  },
];

const faqs = [
  {
    question: 'Do participants need an account to take the test?',
    answer: 'No. Participants only need the assessment link provided by the administrator.',
  },
  {
    question: 'Can results be exported?',
    answer: 'Yes. Assessment results can be exported as structured reports.',
  },
  {
    question: 'Can reports be shared with participants?',
    answer: 'Yes. Administrators can choose whether reports are sent to participants or used internally.',
  },
  {
    question: 'Is the platform suitable for academic use?',
    answer: 'Yes. The platform can be used for educational evaluation and research contexts.',
  },
];

function MotionSection({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
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

export function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        <motion.div
          className="absolute left-[6%] top-10 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -18, 0] }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 22, 0] }}
          transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),transparent_34%),radial-gradient(circle_at_top_right,rgba(226,232,240,0.55),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.05 }}
            className="space-y-8"
          >
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">
              Psychological assessment platform
            </Badge>

            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.5rem] lg:leading-[0.94]">
                Build digital assessments with a calmer workflow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Create IQ, DISC, workload, and custom research assessments, preview the participant journey,
                then activate sharing when the draft is ready.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/signup">
                  Create Workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/t/disc-batch-a">Preview Demo</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroSignals.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...revealTransition, delay: 0.15 + index * 0.08 }}
                  className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur"
                >
                  {item}
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroModules.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...revealTransition, delay: 0.28 + index * 0.06 }}
                  className="rounded-[22px] border border-white/70 bg-white/75 px-5 py-4 text-sm font-medium text-slate-900 shadow-sm backdrop-blur"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...revealTransition, delay: 0.12 }}
          >
            <Card className="relative overflow-hidden border-white/80 bg-white/82 shadow-[0_40px_110px_-52px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <motion.div
                className="absolute right-10 top-10 h-32 w-32 rounded-full bg-slate-100/90 blur-2xl"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              />
              <CardHeader className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Animated user flow</p>
                    <CardTitle className="mt-3 text-2xl">From workspace setup to participant link</CardTitle>
                    <CardDescription className="mt-2 max-w-md text-sm leading-7">
                      Draft first, preview the journey, and switch sharing on only when the assessment is actually ready.
                    </CardDescription>
                  </div>
                  <motion.div
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  >
                    Live preview
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="absolute left-[1.55rem] top-6 hidden h-[15.5rem] w-px bg-gradient-to-b from-slate-200 via-slate-300 to-transparent sm:block" />
                {workflowSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ ...revealTransition, delay: index * 0.08 }}
                    className="relative rounded-[28px] border border-slate-200/90 bg-white/92 p-5 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.28)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
                        {item.step}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-slate-950">{item.title}</p>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                            {item.state}
                          </span>
                        </div>
                        <p className="text-sm leading-7 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_26px_80px_-42px_rgba(15,23,42,0.9)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Participant link</p>
                      <p className="mt-3 text-lg font-medium">/t/disc-hiring-batch-a</p>
                    </div>
                    <Badge className="border-white/10 bg-white/10 text-white">Draft protected</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                      Consent shown first
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                      Preview available
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                      Share when approved
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -right-3 top-28 hidden rounded-[24px] border border-white/90 bg-white/90 p-4 shadow-lg lg:block"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-950">Review-ready setup</p>
                      <p className="text-xs text-slate-500">Purpose, consent, and reporting aligned.</p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <MotionSection id="problem" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Problem"
          title="Psychological assessments are still often manual and inefficient"
          description="Many organizations still conduct psychological tests using paper forms, spreadsheets, or disconnected tools."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {problemPoints.map((point, index) => (
            <motion.div
              key={point}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...revealTransition, delay: index * 0.06 }}
            >
              <Card className="bg-white/85">
                <CardContent className="flex items-start gap-3 p-6">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm leading-7 text-slate-600">{point}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-sm leading-7 text-slate-500">
          When assessments involve dozens or hundreds of participants, these processes quickly become inefficient.
        </p>
      </MotionSection>

      <MotionSection id="solution" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Solution"
          title="A structured platform for digital psychological assessment"
          description="Vanaila Psikotest simplifies the entire assessment process through a single integrated platform."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white/85">
            <CardContent className="space-y-4 p-8 text-sm leading-7 text-slate-600">
              <p>From creating an assessment to generating reports, everything can be managed in one place.</p>
              <p>
                The platform is designed to support ethical testing workflows including participant consent,
                structured administration, automated scoring, and professional reporting.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>What the platform organizes</CardTitle>
              <CardDescription className="text-white/70">
                Core workflow coverage for practical assessment delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {ethicalWorkflowItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-white/85">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MotionSection>

      <MotionSection id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="How It Works" title="Run an assessment in four simple steps" />
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {workflowSteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...revealTransition, delay: index * 0.06 }}
            >
              <Card className="bg-white/85">
                <CardHeader>
                  <Badge className="w-fit border-slate-200 bg-slate-100 text-slate-700">{item.step}</Badge>
                  <CardTitle className="pt-4 text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-500">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="assessment-types" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Assessment Types"
          title="Multiple assessment tools in one platform"
          description="Choose the tool that matches screening, development, wellbeing, or psychology research needs."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {assessmentTypes.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="bg-white/85">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-500">{assessmentUseCases[index]}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection id="audiences" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Designed for Organizations and Education"
          title="Built for practical assessment use across teams and institutions"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {audienceCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="bg-white/85">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-500">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection id="ethical-workflow" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Ethical Assessment Workflow"
          title="Responsible testing practices built into the process"
          description="Vanaila Psikotest is designed to support responsible psychological testing practices."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-white/85">
            <CardContent className="p-8 text-sm leading-7 text-slate-600">
              <p>The system helps organizations manage psychological assessments in a structured and accountable way.</p>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {ethicalWorkflowItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="bg-white/85">
                  <CardContent className="flex items-start gap-3 p-6">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection id="reporting" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Reporting and Insights"
          title="Structured results after every completed assessment"
          description="After participants complete the assessment, the platform automatically generates organized results."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white/85">
            <CardContent className="space-y-4 p-8 text-sm leading-7 text-slate-600">
              <p>Reports include:</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {reportItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>Review, export, or share</CardTitle>
              <CardDescription className="text-white/70">
                Reports can be reviewed, exported, or shared with participants depending on the assessment purpose.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-sm leading-7 text-white/85">
                Structured reporting helps administrators move from raw responses to usable assessment insight without
                rebuilding the process manually for each participant group.
              </div>
            </CardContent>
          </Card>
        </div>
      </MotionSection>

      <MotionSection id="advantages" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="Platform Advantages" title="Practical benefits for day-to-day assessment operations" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {platformAdvantages.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="bg-white/85">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-500">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection id="security" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Data Privacy and Test Security"
          title="Sensitive assessment data handled with controlled access"
          description="Psychological assessment data is treated as sensitive information."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {securityItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="bg-white/85">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-500">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection id="faq" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="Frequently Asked Questions" title="Common questions from administrators and institutions" />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {faqs.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...revealTransition, delay: index * 0.06 }}
            >
              <Card className="bg-white/85">
                <CardHeader>
                  <CardTitle className="text-xl">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-500">{item.answer}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="final-cta" className="mx-auto max-w-7xl px-6 py-16">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">Start With a Workspace</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Sign up and build your first assessment draft today
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75">
                Start with a self-serve workspace for your company or research project, then prepare the participant journey before rollout.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/75">Create your first assessment in minutes.</p>
            </div>
            <motion.div
              className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur"
              whileInView={{ opacity: [0.9, 1, 0.9], y: [0, -4, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm text-white/60">Customer onboarding</p>
              <p className="mt-3 text-2xl font-semibold">Create your first assessment</p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Use the four-step onboarding flow to choose a test type, configure settings, preview the experience, and prepare the participant link.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="mt-6 w-full justify-center bg-white text-slate-950 hover:bg-white/90"
                asChild
              >
                <Link to="/signup">Create Your First Assessment</Link>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}
