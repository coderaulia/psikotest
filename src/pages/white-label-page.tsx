import { motion } from 'framer-motion';
import {
  ArrowRight,
  Globe,
  Layers3,
  Palette,
  ShieldCheck,
  Stamp,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/lib/language';

const revealTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

interface WhiteLabelFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const copy = {
  en: {
    heroBadge: 'White-label offering',
    heroTitle: 'Turn the platform into your own assessment product.',
    heroDesc:
      'Use the same assessment engine and reporting workflow behind your own brand, so clients and participants experience it as your platform.',
    heroTags: ['Brandable interface', 'Private operational flow', 'Built for HR, education, and research'],
    ctaWorkspace: 'Start a Workspace',
    ctaManual: 'Read Product Manual',
    panelTop: 'Branded deployment',
    panelTitle: 'Your name, your operating model',
    panelBadge: 'White-label ready',
    panelFields: [
      { label: 'Brand layer', value: 'Logo, colors, language' },
      { label: 'Participant flow', value: 'Private link, consent, delivery' },
      { label: 'Reporting', value: 'Internal reviewer or participant summary' },
      { label: 'Use case', value: 'Hiring, research, education' },
    ],
    panelDesc:
      'Start from the SaaS foundation for speed, then shape branding, communication, and workflow around your own identity.',
    whyEyebrow: 'Why white-label',
    whyTitle: 'Keep SaaS structure, but make the experience feel fully yours',
    whyDesc:
      'The product already works as self-serve SaaS. White-label helps when participant-facing trust and brand continuity matter.',
    fitTop: 'Who it fits',
    fitTitle: 'Strongest when trust, ownership, and brand continuity matter',
    fitDesc:
      'White-label is ideal when assessment delivery should feel like part of your own service, not a third-party tool.',
    brandTop: 'What can be branded or adapted',
    brandTitle: 'White-label goes beyond visual changes',
    brandDesc:
      'The goal is not only replacing logo and color. It is aligning messaging, participant journey, and reporting behavior with your operating model.',
    flowEyebrow: 'Rollout flow',
    flowTitle: 'A clean sequence for turning SaaS into your branded layer',
    flowDesc:
      'Start from operations first, then adapt branding and participant communication around real workflow needs.',
    finalEyebrow: 'White-label next step',
    finalTitle: 'Start with the platform, then shape the branded layer around your purpose.',
    finalDesc:
      'Use the current SaaS platform as operational base, then adapt branding, flow, and reporting to your organization or research program.',
    finalWorkspace: 'Start With a Workspace',
    finalManual: 'Open Manual',
  },
  id: {
    heroBadge: 'Penawaran White-label',
    heroTitle: 'Jadikan platform ini sebagai produk asesmen dengan brand kamu sendiri.',
    heroDesc:
      'Pakai mesin asesmen dan alur report yang sama, tapi tampilkan semuanya dengan identitas brand kamu supaya klien dan peserta merasa ini platform milik kamu.',
    heroTags: ['Tampilan bisa di-branding', 'Alur operasional privat', 'Cocok untuk HR, pendidikan, dan riset'],
    ctaWorkspace: 'Mulai Workspace',
    ctaManual: 'Baca Panduan Produk',
    panelTop: 'Deploy ber-brand',
    panelTitle: 'Nama kamu, model operasional kamu',
    panelBadge: 'Siap white-label',
    panelFields: [
      { label: 'Layer brand', value: 'Logo, warna, bahasa' },
      { label: 'Alur peserta', value: 'Link privat, consent, delivery' },
      { label: 'Pelaporan', value: 'Reviewer internal atau ringkasan peserta' },
      { label: 'Use case', value: 'Hiring, riset, pendidikan' },
    ],
    panelDesc:
      'Mulai dari fondasi SaaS biar cepat jalan, lalu bentuk branding, komunikasi, dan workflow sesuai identitasmu sendiri.',
    whyEyebrow: 'Kenapa white-label',
    whyTitle: 'Pertahankan struktur SaaS, tapi pengalaman tetap terasa milik kamu',
    whyDesc:
      'Produknya sudah jalan sebagai SaaS self-serve. White-label jadi penting saat trust dan kesinambungan brand di sisi peserta benar-benar krusial.',
    fitTop: 'Cocok untuk siapa',
    fitTitle: 'Paling kuat dipakai saat trust, ownership, dan kontinuitas brand jadi prioritas',
    fitDesc:
      'White-label pas saat delivery asesmen harus terasa sebagai bagian dari layananmu sendiri, bukan tool pihak ketiga.',
    brandTop: 'Bagian yang bisa di-branding atau diadaptasi',
    brandTitle: 'White-label bukan cuma ganti tampilan visual',
    brandDesc:
      'Tujuannya bukan sekadar ganti logo atau warna, tapi menyelaraskan pesan, alur peserta, dan perilaku laporan dengan model operasi kamu.',
    flowEyebrow: 'Alur rollout',
    flowTitle: 'Urutan rapi buat ubah SaaS jadi layer produk ber-brand kamu',
    flowDesc:
      'Mulai dari kebutuhan operasional dulu, lalu sesuaikan branding dan komunikasi peserta berdasarkan alur kerja nyata.',
    finalEyebrow: 'Langkah lanjut white-label',
    finalTitle: 'Mulai dari platform yang ada, lalu bentuk layer brand sesuai tujuanmu.',
    finalDesc:
      'Pakai platform SaaS saat ini sebagai basis operasional, lalu adaptasi branding, alur, dan pelaporan sesuai organisasi atau program risetmu.',
    finalWorkspace: 'Mulai dari Workspace',
    finalManual: 'Buka Panduan',
  },
} as const;

const whiteLabelHighlightsByLanguage: Record<'en' | 'id', WhiteLabelFeature[]> = {
  en: [
    {
      title: 'Brand identity and tone',
      description: 'Apply your own logo, naming, visual tone, and communication style so the platform feels native.',
      icon: Palette,
    },
    {
      title: 'Private delivery workflow',
      description: 'Run the same assessment engine inside your own hiring, research, or consulting workflow.',
      icon: Layers3,
    },
    {
      title: 'Domain and launch experience',
      description: 'Distribute assessments under your own identity instead of a generic shared SaaS brand.',
      icon: Globe,
    },
    {
      title: 'Controlled reporting and access',
      description: 'Set result visibility and reviewer access policy based on your internal operating model.',
      icon: ShieldCheck,
    },
  ],
  id: [
    {
      title: 'Identitas dan tone brand',
      description: 'Pakai logo, naming, tone visual, dan gaya komunikasi kamu sendiri biar platform terasa native.',
      icon: Palette,
    },
    {
      title: 'Alur delivery yang privat',
      description: 'Jalankan mesin asesmen yang sama di dalam alur hiring, riset, atau konsultasi kamu sendiri.',
      icon: Layers3,
    },
    {
      title: 'Pengalaman domain dan launch',
      description: 'Distribusikan asesmen dengan identitasmu sendiri, bukan lewat brand SaaS umum.',
      icon: Globe,
    },
    {
      title: 'Kontrol report dan akses',
      description: 'Atur visibilitas hasil dan akses reviewer sesuai model operasional internalmu.',
      icon: ShieldCheck,
    },
  ],
};

const useCasesByLanguage = {
  en: [
    'HR consultancies that want a branded assessment portal for clients',
    'Internal people teams that need a private assessment experience',
    'Psychology labs collecting data under their own research identity',
    'Education institutions running structured assessment programs',
  ],
  id: [
    'Konsultan HR yang mau punya portal asesmen ber-brand untuk klien',
    'Tim people internal yang butuh pengalaman asesmen privat',
    'Lab psikologi yang mengumpulkan data dengan identitas riset sendiri',
    'Institusi pendidikan yang menjalankan program asesmen terstruktur',
  ],
} as const;

const brandingScopeByLanguage = {
  en: [
    'App name, logo, and visual identity',
    'Landing messaging and value proposition',
    'Participant-facing consent and instruction framing',
    'Result delivery mode and reviewer workflow',
    'Assessment catalog structure for your use case',
    'Reporting surfaces aligned with your operating model',
  ],
  id: [
    'Nama aplikasi, logo, dan identitas visual',
    'Pesan landing page dan value proposition',
    'Framing consent dan instruksi di sisi peserta',
    'Mode delivery hasil dan alur reviewer',
    'Struktur katalog asesmen sesuai use case',
    'Tampilan laporan yang nyambung dengan model operasionalmu',
  ],
} as const;

const deliveryModelsByLanguage = {
  en: [
    {
      title: 'Branded SaaS workspace',
      description: 'Start from the existing SaaS flow, then adapt outward-facing experience for your organization or research program.',
    },
    {
      title: 'Private branded deployment',
      description: 'Run the platform as your own private assessment environment with your own participant-facing identity.',
    },
    {
      title: 'Program-specific configuration',
      description: 'Shape modules, visibility rules, and onboarding around your real process and audience.',
    },
  ],
  id: [
    {
      title: 'Workspace SaaS ber-brand',
      description: 'Mulai dari alur SaaS yang ada, lalu sesuaikan pengalaman eksternal untuk organisasi atau program risetmu.',
    },
    {
      title: 'Deploy privat ber-brand',
      description: 'Jalankan platform sebagai lingkungan asesmen privat dengan identitas participant-facing milikmu sendiri.',
    },
    {
      title: 'Konfigurasi spesifik program',
      description: 'Sesuaikan modul, aturan visibilitas, dan onboarding berdasarkan proses dan audiens nyata kamu.',
    },
  ],
} as const;

const rolloutStepsByLanguage = {
  en: [
    {
      step: '01',
      title: 'Clarify the operating model',
      description: 'Decide whether the focus is hiring, internal development, education, research, or mixed operations.',
    },
    {
      step: '02',
      title: 'Map the branded experience',
      description: 'Define identity, consent messaging, participant communication, and report surfaces.',
    },
    {
      step: '03',
      title: 'Configure the workflow',
      description: 'Set test catalog, result policy, reviewer flow, and participant link behavior.',
    },
    {
      step: '04',
      title: 'Launch under your own purpose',
      description: 'Run assessments as your own product experience while keeping operational structure solid.',
    },
  ],
  id: [
    {
      step: '01',
      title: 'Tentukan model operasional',
      description: 'Pastikan fokus utamanya hiring, pengembangan internal, pendidikan, riset, atau gabungan.',
    },
    {
      step: '02',
      title: 'Petakan pengalaman ber-brand',
      description: 'Tetapkan identitas, pesan consent, komunikasi peserta, dan tampilan laporan.',
    },
    {
      step: '03',
      title: 'Konfigurasi workflow',
      description: 'Atur katalog tes, kebijakan hasil, alur reviewer, dan perilaku link peserta.',
    },
    {
      step: '04',
      title: 'Launch sesuai tujuanmu',
      description: 'Jalankan asesmen sebagai pengalaman produkmu sendiri dengan struktur operasional yang tetap rapi.',
    },
  ],
} as const;

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
  const { language } = useLanguage();
  const t = copy[language];
  const whiteLabelHighlights = whiteLabelHighlightsByLanguage[language];
  const useCases = useCasesByLanguage[language];
  const brandingScope = brandingScopeByLanguage[language];
  const deliveryModels = deliveryModelsByLanguage[language];
  const rolloutSteps = rolloutStepsByLanguage[language];

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
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">{t.heroBadge}</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.95]">
                {t.heroTitle}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{t.heroDesc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {t.heroTags.map((item) => (
                <span key={item} className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/signup">
                  {t.ctaWorkspace} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/manual">{t.ctaManual}</Link>
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
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.panelTop}</p>
                      <p className="mt-1 text-lg font-medium">{t.panelTitle}</p>
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/10 text-white">{t.panelBadge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {t.panelFields.map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                      <p className="mt-3 text-sm leading-7 text-white/82">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-sm leading-7 text-white/78">{t.panelDesc}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24 xl:py-28">
        <SectionHeading eyebrow={t.whyEyebrow} title={t.whyTitle} description={t.whyDesc} />
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
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.fitTop}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{t.fitTitle}</h2>
              <p className="text-sm leading-7 text-slate-600">{t.fitDesc}</p>
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
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.brandTop}</p>
              <CardTitle className="text-3xl">{t.brandTitle}</CardTitle>
              <CardDescription className="text-sm leading-7 text-white/68">{t.brandDesc}</CardDescription>
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
        <SectionHeading eyebrow={t.flowEyebrow} title={t.flowTitle} description={t.flowDesc} />
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">{step.step}</div>
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
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">{t.finalEyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight">{t.finalTitle}</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">{t.finalDesc}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" className="justify-center bg-white text-slate-950 hover:bg-white/90" asChild>
                <Link to="/signup">{t.finalWorkspace}</Link>
              </Button>
              <Button size="lg" className="justify-center border border-white/15 bg-white/10 text-white hover:bg-white/15" asChild>
                <Link to="/manual">{t.finalManual}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}
