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
  type LucideIcon,
  LockKeyhole,
  ShieldCheck,
  Users,
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

const problemPoints = [
  'Manual scoring and calculations',
  'Difficult participant management',
  'Slow result processing',
  'Limited reporting and insights',
];

const workflowSteps = [
  {
    step: '01',
    title: 'Create an assessment',
    description: 'Choose the type of psychological test you want to administer and define the assessment purpose.',
  },
  {
    step: '02',
    title: 'Share the participant link',
    description: 'Invite candidates, students, or participants through a secure assessment link.',
  },
  {
    step: '03',
    title: 'Participants complete the test online',
    description: 'Participants answer questions through a clean and distraction-free interface.',
  },
  {
    step: '04',
    title: 'Receive structured reports',
    description: 'Results are calculated automatically and presented in organized assessment reports.',
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
];

const assessmentUseCases = [
  'Often used for recruitment screening and academic evaluation.',
  'Useful for recruitment, team development, and leadership assessment.',
  'Useful for organizational wellbeing programs and academic research.',
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

export function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">
              Digital Psychological Assessments
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Digital Psychological Assessments for Organizations and Education
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                Run IQ, personality, and workload assessments online with a structured and ethical workflow.
              </p>
              <p className="max-w-3xl text-base leading-8 text-slate-500">
                Vanaila Psikotest helps HR teams, universities, and organizations conduct psychological assessments
                more efficiently - from test administration to automated scoring and professional reports.
              </p>
              <p className="max-w-3xl text-base leading-8 text-slate-500">
                Create an assessment, share it with participants, and receive structured results in minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/admin/login">
                  Start an Assessment <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <a href="#how-it-works">View How It Works</a>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {assessmentTypes.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/70 bg-white/75 px-5 py-4 text-sm text-slate-600 shadow-sm backdrop-blur"
                >
                  <p className="font-medium text-slate-950">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-white/80 bg-white/85 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle>Structured assessment workflow</CardTitle>
              <CardDescription>
                One integrated platform for ethical administration, automated scoring, and professional reporting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowSteps.map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-950">{item.title}</p>
                      <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Consent-first workflow
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  Structured automated reports
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="problem" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Problem"
          title="Psychological assessments are still often manual and inefficient"
          description="Many organizations still conduct psychological tests using paper forms, spreadsheets, or disconnected tools."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {problemPoints.map((point) => (
            <Card key={point} className="bg-white/85">
              <CardContent className="flex items-start gap-3 p-6">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-sm leading-7 text-slate-600">{point}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-sm leading-7 text-slate-500">
          When assessments involve dozens or hundreds of participants, these processes quickly become inefficient.
        </p>
      </section>

      <section id="solution" className="mx-auto max-w-7xl px-6 py-16">
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
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="How It Works" title="Run an assessment in four simple steps" />
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {workflowSteps.map((item) => (
            <Card key={item.step} className="bg-white/85">
              <CardHeader>
                <Badge className="w-fit border-slate-200 bg-slate-100 text-slate-700">{item.step}</Badge>
                <CardTitle className="pt-4 text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="assessment-types" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Assessment Types"
          title="Multiple assessment tools in one platform"
          description="Choose the tool that matches the screening, development, wellbeing, or research objective."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {assessmentTypes.map((category, index) => {
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
                <CardContent>
                  <p className="text-sm leading-7 text-slate-500">{assessmentUseCases[index]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="audiences" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Designed for Organizations and Education"
          title="Built for practical assessment use across teams and institutions"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {audienceCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white/85">
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
            );
          })}
        </div>
      </section>

      <section id="ethical-workflow" className="mx-auto max-w-7xl px-6 py-16">
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
            {ethicalWorkflowItems.map((item) => (
              <Card key={item} className="bg-white/85">
                <CardContent className="flex items-start gap-3 p-6">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-7 text-slate-600">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="reporting" className="mx-auto max-w-7xl px-6 py-16">
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
      </section>

      <section id="advantages" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="Platform Advantages" title="Practical benefits for day-to-day assessment operations" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {platformAdvantages.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white/85">
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
            );
          })}
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Data Privacy and Test Security"
          title="Sensitive assessment data handled with controlled access"
          description="Psychological assessment data is treated as sensitive information."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {securityItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white/85">
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
            );
          })}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="Frequently Asked Questions" title="Common questions from administrators and institutions" />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {faqs.map((item) => (
            <Card key={item.question} className="bg-white/85">
              <CardHeader>
                <CardTitle className="text-xl">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-500">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="final-cta" className="mx-auto max-w-7xl px-6 py-16">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">Start Today</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Start running structured psychological assessments today
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75">
                Replace manual testing with a faster and more organized system.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/75">Create your first assessment in minutes.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm text-white/60">Get started</p>
              <p className="mt-3 text-2xl font-semibold">Create your first assessment</p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Move your workflow from manual administration to structured digital reporting.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="mt-6 w-full justify-center bg-white text-slate-950 hover:bg-white/90"
                asChild
              >
                <Link to="/admin/login">Create Your First Assessment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
