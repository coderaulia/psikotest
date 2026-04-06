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
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { landingCopy } from '@/lib/landing-copy';
import { useLanguage } from '@/lib/language';

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

const heroFlowPanels: Array<{ eyebrow: string; title: string; items: string[] }> = [
  {
    eyebrow: 'Workspace',
    title: 'Create draft',
    items: ['Test type', 'Purpose'],
  },
  {
    eyebrow: 'Preview',
    title: 'Preview flow',
    items: ['Consent', 'Screens'],
  },
  {
    eyebrow: 'Launch',
    title: 'Go live',
    items: ['Private link', 'Controlled share'],
  },
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

const assessmentTypeLayouts = [
  {
    gridClass: 'lg:col-span-4',
    badge: 'Timed multiple choice',
    highlights: ['Reasoning bands', 'Screening-ready scores'],
    useCase: 'Best for recruitment screening and academic evaluation when you need a quick cognitive signal.',
    cardClass: 'border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96)_58%,rgba(219,234,254,0.72))]',
    badgeClass: 'border-sky-100 bg-sky-50 text-sky-700',
    iconClass: 'bg-slate-950 text-white',
    dark: false,
  },
  {
    gridClass: 'lg:col-span-2',
    badge: 'Forced choice profile',
    highlights: ['D / I / S / C pattern', 'Useful for team dynamics'],
    useCase: 'Useful for recruitment, leadership development, and communication-pattern review.',
    cardClass: 'border-slate-200/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(236,253,245,0.9)_56%,rgba(220,252,231,0.75))]',
    badgeClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    iconClass: 'bg-slate-950 text-white',
    dark: false,
  },
  {
    gridClass: 'lg:col-span-2',
    badge: 'Likert workload scale',
    highlights: ['Mental demand', 'Stress and fatigue'],
    useCase: 'Useful for organizational wellbeing programs, operations monitoring, and academic workload studies.',
    cardClass: 'border-slate-200/80 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(255,251,235,0.92)_56%,rgba(254,242,242,0.74))]',
    badgeClass: 'border-amber-100 bg-amber-50 text-amber-700',
    iconClass: 'bg-slate-950 text-white',
    dark: false,
  },
  {
    gridClass: 'lg:col-span-4',
    badge: 'Research instruments',
    highlights: ['Flexible constructs', 'Structured dataset collection'],
    useCase: 'Ideal for thesis studies, psychology experiments, new scale development, and structured academic data collection.',
    cardClass: 'border-slate-900 bg-[linear-gradient(145deg,#020617,#0f172a_58%,#134e4a)]',
    badgeClass: 'border-white/10 bg-white/10 text-white',
    iconClass: 'bg-white/10 text-white',
    dark: true,
  },
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
  const { language } = useLanguage();
  const t = landingCopy[language];
  const localizedAssessmentTypes = assessmentTypes.map((item, index) => ({ ...item, ...t.assessmentTypes.items[index]! }));
  const localizedAudienceCards = audienceCards.map((item, index) => ({ ...item, ...t.audiences.cards[index]! }));
  const localizedPlatformAdvantages = platformAdvantages.map((item, index) => ({ ...item, ...t.advantages.cards[index]! }));
  const localizedSecurityItems = securityItems.map((item, index) => ({ ...item, ...t.security.items[index]! }));
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
              {t.hero.badge}
            </Badge>

            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.5rem] lg:leading-[0.94]">
                {t.hero.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{t.hero.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/signup">
                  {t.hero.ctaCreate} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/t/disc-public-001">{t.hero.ctaDemo}</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-slate-200 bg-white/80 text-slate-700 hover:bg-white" asChild>
                <Link to="/white-label">{t.hero.ctaWhiteLabel}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {t.hero.signals.map((item, index) => (
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
              {t.hero.modules.map((item, index) => (
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
            <Card className="relative overflow-hidden border-white/80 bg-white/84 shadow-[0_36px_90px_-54px_rgba(15,23,42,0.32)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.88),transparent_52%),radial-gradient(circle_at_top_right,rgba(209,250,229,0.7),transparent_42%)]" />
              <CardHeader className="relative border-b border-slate-100/80 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-300" />
                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                    <span className="h-3 w-3 rounded-full bg-emerald-300" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-500">
                    {t.hero.draftBadge}
                  </span>
                </div>
                <div className="mt-6 space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t.hero.flowEyebrow}</p>
                  <CardTitle className="text-2xl">{t.hero.flowTitle}</CardTitle>
                  <CardDescription className="max-w-lg text-sm leading-7">{t.hero.flowDescription}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5 pt-6">
                <div className="grid gap-3 xl:grid-cols-3">
                  {t.hero.flowPanels.map((panel, index) => (
                    <motion.div
                      key={panel.eyebrow}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...revealTransition, delay: 0.2 + index * 0.08 }}
                      className="rounded-[24px] border border-slate-200/90 bg-white/92 p-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{panel.eyebrow}</p>
                      <p className="mt-3 text-lg font-medium text-slate-950">{panel.title}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {panel.items.map((item) => (
                          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                            {item}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <motion.div
                    className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_24px_72px_-44px_rgba(15,23,42,0.8)]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{t.hero.participantLinkLabel}</p>
                        <p className="mt-3 text-lg font-medium">{t.hero.participantLinkValue}</p>
                      </div>
                      <Badge className="border-white/10 bg-white/10 text-white">{t.hero.participantLinkStatus}</Badge>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                        {t.hero.participantLinkItems[0]}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                        {t.hero.participantLinkItems[1]}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/75">
                        {t.hero.participantLinkItems[2]}
                      </div>
                    </div>
                  </motion.div>

                  <div className="rounded-[28px] border border-slate-200/90 bg-white/92 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t.hero.checklistTitle}</p>
                    <div className="mt-4 space-y-3">
                      {t.hero.checklistItems.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-2 rounded-full bg-slate-950"
                        animate={{ width: ['34%', '72%', '34%'] }}
                        transition={{ duration: 6.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{t.hero.checklistCaption}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <MotionSection id="problem" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow={t.problem.eyebrow}
          title={t.problem.title}
          description={t.problem.description}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.problem.points.map((point, index) => (
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
          {t.problem.footnote}
        </p>
      </MotionSection>

      <MotionSection id="solution" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow={t.solution.eyebrow}
          title={t.solution.title}
          description={t.solution.description}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white/85">
            <CardContent className="space-y-4 p-8 text-sm leading-7 text-slate-600">
              {t.solution.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>{t.solution.panelTitle}</CardTitle>
              <CardDescription className="text-white/70">
                {t.solution.panelDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {t.solution.ethicalWorkflowItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-white/85">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MotionSection>

      <MotionSection id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} />
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {t.howItWorks.steps.map((item, index) => (
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

      <MotionSection id="assessment-types" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow={t.assessmentTypes.eyebrow}
          title={t.assessmentTypes.title}
          description={t.assessmentTypes.description}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-6">
          {localizedAssessmentTypes.map((category, index) => {
            const Icon = category.icon;
            const layout = assessmentTypeLayouts[index]!;

            return (
              <motion.div
                key={category.title}
                className={layout.gridClass}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className={`group relative h-full overflow-hidden ${layout.cardClass}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%)]" />
                  <CardHeader className="relative space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${layout.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge className={layout.badgeClass}>{category.badge}</Badge>
                    </div>
                    <div className="space-y-3">
                      <CardTitle className={layout.dark ? 'text-white' : 'text-slate-950'}>{category.title}</CardTitle>
                      {layout.dark ? (
                        <p className="text-base leading-7 text-white">{category.description}</p>
                      ) : (
                        <CardDescription className="text-base leading-7 text-slate-600">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="relative flex h-full flex-col justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                      {category.highlights.map((item) => (
                        <span
                          key={item}
                          className={`rounded-full px-3 py-1 text-sm ${layout.dark ? 'border border-white/10 bg-white/10 text-white/80' : 'border border-white/80 bg-white/80 text-slate-600'}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className={`rounded-[24px] p-4 text-sm leading-7 ${layout.dark ? 'border border-white/10 bg-white/10 text-white/78' : 'border border-white/80 bg-white/82 text-slate-600'}`}>
                      {category.useCase}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection id="audiences" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="overflow-hidden border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96)_58%,rgba(224,242,254,0.72))]">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.audiences.eyebrow}</p>
                <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-slate-950">
                  {t.audiences.title}
                </h2>
                <p className="max-w-lg text-sm leading-7 text-slate-600">{t.audiences.description}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {t.audiences.tags.map((item) => (
                  <span key={item} className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-sm text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            {localizedAudienceCards.map((item, index) => {
              const Icon = item.icon;
              const accentClasses = [
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(224,231,255,0.78))]',
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(220,252,231,0.7))]',
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(254,240,138,0.28))]',
              ];

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: index * 0.06 }}
                >
                  <Card className={`h-full border-slate-200/80 ${accentClasses[index]}`}>
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="pt-4">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </MotionSection>

      <MotionSection id="ethical-workflow" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="overflow-hidden rounded-[40px] bg-slate-950 px-8 py-10 text-white shadow-[0_40px_120px_-70px_rgba(15,23,42,0.85)]">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.ethicalWorkflow.eyebrow}</p>
              <h2 className="max-w-md text-3xl font-semibold tracking-tight">
                {t.ethicalWorkflow.title}
              </h2>
              <p className="max-w-md text-sm leading-7 text-white/70">{t.ethicalWorkflow.description}</p>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-sm leading-7 text-white/78">
                {t.ethicalWorkflow.note}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {t.solution.ethicalWorkflowItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: index * 0.06 }}
                  className="rounded-[26px] border border-white/10 bg-white/10 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <p className="text-sm leading-7 text-white/82">{item}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection id="reporting" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98)_58%,rgba(219,234,254,0.62))]">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t.reporting.eyebrow}</p>
              <CardTitle className="text-3xl">{t.reporting.title}</CardTitle>
              <CardDescription className="max-w-xl text-sm leading-7 text-slate-600">
                {t.reporting.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {t.reporting.items.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: index * 0.06 }}
                  className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white/82 px-4 py-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-600">{item}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-200/80 bg-white/90">
              <CardHeader>
                <CardTitle>{t.reporting.modesTitle}</CardTitle>
                <CardDescription>{t.reporting.modesDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {t.reporting.modes.map((item) => (
                  <div key={item} className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 text-sm leading-7 text-slate-600">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-950 text-white">
              <CardHeader>
                <CardTitle>{t.reporting.valueTitle}</CardTitle>
                <CardDescription className="text-white/65">
                  {t.reporting.valueDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {t.reporting.valueItems.map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-sm text-white/78">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </MotionSection>

      <MotionSection id="advantages" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <Card className="overflow-hidden border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(226,232,240,0.92)_58%,rgba(191,219,254,0.58))]">
            <CardContent className="space-y-5 p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.advantages.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {t.advantages.title}
              </h2>
              <p className="max-w-md text-sm leading-7 text-slate-600">
                {t.advantages.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {t.advantages.tags.map((item) => (
                  <span key={item} className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-sm text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {localizedPlatformAdvantages.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
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
                      <CardTitle className="pt-4">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </MotionSection>

      <MotionSection id="security" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <Card className="overflow-hidden bg-slate-950 text-white shadow-[0_34px_100px_-60px_rgba(15,23,42,0.8)]">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.security.eyebrow}</p>
                <h2 className="max-w-lg text-3xl font-semibold tracking-tight">
                  {t.security.title}
                </h2>
                <p className="max-w-lg text-sm leading-7 text-white/72">
                  {t.security.description}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-6">
                <p className="text-sm leading-7 text-white/82">
                  {t.security.note}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {localizedSecurityItems.map((item, index) => {
              const Icon = item.icon;
              const surface = [
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(224,231,255,0.72))]',
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(219,234,254,0.72))]',
                'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(226,232,240,0.78))]',
              ];

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: index * 0.06 }}
                >
                  <Card className={`border-slate-200/80 ${surface[index]}`}>
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="pt-4">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </MotionSection>      <MotionSection id="faq" className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {t.faq.items.map((item, index) => (
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
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">{t.finalCta.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t.finalCta.title}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75">
                {t.finalCta.description}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div
                className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur"
                whileInView={{ opacity: [0.9, 1, 0.9], y: [0, -4, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                <p className="text-sm text-white/60">{t.finalCta.saasLabel}</p>
                <p className="mt-3 text-2xl font-semibold">{t.finalCta.saasTitle}</p>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  {t.finalCta.saasDescription}
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-6 w-full justify-center bg-white text-slate-950 hover:bg-white/90"
                  asChild
                >
                  <Link to="/signup">{t.finalCta.saasCta}</Link>
                </Button>
              </motion.div>
              <motion.div
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur"
                whileInView={{ opacity: [0.88, 1, 0.88], y: [0, -3, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 0.3 }}
              >
                <p className="text-sm text-white/60">{t.finalCta.whiteLabelLabel}</p>
                <p className="mt-3 text-2xl font-semibold">{t.finalCta.whiteLabelTitle}</p>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  {t.finalCta.whiteLabelDescription}
                </p>
                <Button
                  size="lg"
                  className="mt-6 w-full justify-center border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  asChild
                >
                  <Link to="/white-label">{t.hero.ctaWhiteLabel}</Link>
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}

























