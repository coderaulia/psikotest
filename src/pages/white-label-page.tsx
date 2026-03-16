import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe,
  Layers3,
  Palette,
  ShieldCheck,
  Sparkles,
  Stamp,
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

interface WhiteLabelFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const whiteLabelHighlights: WhiteLabelFeature[] = [
  {
    title: 'Brand identity and tone',
    description: 'Apply your own logo, naming, visual tone, and client-facing positioning so the platform feels native to your organization.',
    icon: Palette,
  },
  {
    title: 'Private delivery workflow',
    description: 'Use the same assessment engine with a workflow shaped around your hiring program, research protocol, or consulting process.',
    icon: Layers3,
  },
  {
    title: 'Domain and launch experience',
    description: 'Run assessments behind your own project or company identity instead of sending participants to a generic SaaS brand.',
    icon: Globe,
  },
  {
    title: 'Controlled reporting and access',
    description: 'Set result visibility, reviewer flow, and audience access rules in a way that reflects your internal operating model.',
    icon: ShieldCheck,
  },
];

const useCases = [
  'HR consultancies that want a branded assessment portal for clients',
  'Internal people and talent teams that need a private assessment experience',
  'Psychology labs or academic researchers collecting data under their own research identity',
  'Education or training institutions running assessments as part of a structured program',
];

const brandingScope = [
  'App name, logo, and visual identity',
  'Landing page messaging and value proposition',
  'Participant-facing consent and instructions framing',
  'Result delivery mode and reviewer workflow configuration',
  'Assessment catalog structure for your use case',
  'Report surfaces aligned with your operating model',
];

const deliveryModels = [
  {
    title: 'Branded SaaS workspace',
    description: 'Start from the existing SaaS flow, then adapt the outward-facing experience for your organization or research program.',
  },
  {
    title: 'Private branded deployment',
    description: 'Use the platform primarily as your own assessment environment, with participant links and operational flow centered around your brand.',
  },
  {
    title: 'Program-specific configuration',
    description: 'Shape modules, visibility rules, and onboarding around a hiring pipeline, research project, or institutional workflow.',
  },
];

const rolloutSteps = [
  {
    step: '01',
    title: 'Clarify the operating model',
    description: 'Decide whether the app is being used for hiring, internal development, education, research, or a mixed operational program.',
  },
  {
    step: '02',
    title: 'Map the branded experience',
    description: 'Define how your identity, consent language, participant messaging, and reporting surfaces should appear.',
  },
  {
    step: '03',
    title: 'Configure the assessment workflow',
    description: 'Set test catalog, result delivery rules, reviewer flow, and participant-link behavior so the system matches the actual process.',
  },
  {
    step: '04',
    title: 'Launch under your own purpose',
    description: 'Distribute assessments as your own operational experience while keeping the underlying platform structured and maintainable.',
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

export function WhiteLabelPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-indigo-100/75 blur-3xl" />
        <div className="absolute right-[10%] top-24 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.05 }}
            className="space-y-7"
          >
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">White-label offering</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.95]">
                Turn the platform into your own assessment product.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Use the assessment engine, workflow, and reporting structure behind your own brand so companies, clients, or research participants experience it as your platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Brandable interface', 'Private operational flow', 'Built for HR, education, and research'].map((item) => (
                <span key={item} className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start a Workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/manual">Read Product Manual</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...revealTransition, delay: 0.14 }}
          >
            <Card className="overflow-hidden border-slate-900 bg-[linear-gradient(150deg,#020617,#0f172a_54%,#134e4a)] text-white shadow-[0_40px_110px_-70px_rgba(15,23,42,0.88)]">
              <CardHeader className="border-b border-white/10 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Stamp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">Branded deployment</p>
                      <p className="mt-1 text-lg font-medium">Your name, your operating model</p>
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/10 text-white">White-label ready</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Brand layer', value: 'Logo, colors, language' },
                    { label: 'Participant flow', value: 'Private link, consent, delivery' },
                    { label: 'Reporting', value: 'Internal reviewer or participant summary' },
                    { label: 'Use case', value: 'Hiring, research, education' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                      <p className="mt-3 text-sm leading-7 text-white/82">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-sm leading-7 text-white/78">
                  Use the existing SaaS foundation when you want speed, or position the product as a company-specific or research-specific platform when brand ownership matters more than a shared public identity.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow="Why white-label"
          title="Keep the structure of SaaS, but let the experience belong to your organization"
          description="The current product works as a self-serve SaaS. White-label positioning makes it suitable when the company, consultancy, or researcher needs the participant and client-facing experience to feel fully their own."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {whiteLabelHighlights.map((item, index) => {
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
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Card className="overflow-hidden border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96)_58%,rgba(224,231,255,0.72))]">
            <CardContent className="space-y-5 p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Who it fits</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Strongest when trust, ownership, and brand continuity matter
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                White-label is useful when the product should feel like part of your service or program, not like a third-party tool sitting beside it.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
                className="rounded-[28px] border border-slate-200/80 bg-white/88 p-5 text-sm leading-7 text-slate-600"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <Card className="overflow-hidden bg-slate-950 text-white">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">What can be branded or adapted</p>
              <CardTitle className="text-3xl">The branded layer can extend well beyond a logo swap</CardTitle>
              <CardDescription className="text-sm leading-7 text-white/68">
                The point of white-label is not only appearance. It is also about matching your own communication, workflow rules, and participant expectations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {brandingScope.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-sm text-white/82">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {deliveryModels.map((model, index) => (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.06 }}
              >
                <Card className="border-slate-200/80 bg-white/88">
                  <CardHeader>
                    <CardTitle>{model.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-600">{model.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading
          eyebrow="Rollout flow"
          title="A clean sequence for turning the SaaS foundation into your own product layer"
          description="The safest white-label approach is operational first: clarify the real workflow, then adapt the branding and participant-facing experience around it."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {rolloutSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...revealTransition, delay: index * 0.06 }}
            >
              <Card className="h-full border-slate-200/80 bg-white/88">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    {step.step}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-slate-950">{step.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16">
        <Card className="overflow-hidden border-slate-900 bg-[linear-gradient(145deg,#020617,#0f172a_56%,#134e4a)] text-white shadow-[0_40px_110px_-70px_rgba(15,23,42,0.88)]">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">White-label next step</p>
              <h2 className="text-3xl font-semibold tracking-tight">Start with the platform, then shape the branded layer around your purpose.</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                If you want a private-branded assessment experience, the current SaaS platform can act as the operational base while branding, workflow, and reporting are adapted to your organization or research program.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" className="justify-center bg-white text-slate-950 hover:bg-white/90" asChild>
                <Link to="/signup">Start With a Workspace</Link>
              </Button>
              <Button size="lg" className="justify-center border border-white/15 bg-white/10 text-white hover:bg-white/15" asChild>
                <Link to="/manual">Open Manual</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}
