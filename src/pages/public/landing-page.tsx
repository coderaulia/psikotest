import { useState, useTransition, type ReactNode } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  LockKeyhole,
  Mail,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/language';

const TEST_SESSION_MAP = {
  disc: "disc-public-001",
  iq: "iq-public-001",
  workload: "workload-public-001"
} as const;

type TestKey = keyof typeof TEST_SESSION_MAP;

interface TestCardCopy {
  key: TestKey;
  title: string;
  description: string;
  detail: string;
  cta: string;
  icon: LucideIcon;
  accent: string;
}

interface CopyShape {
  hero: {
    badge: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
    signals: string[];
    panelFreeEyebrow: string;
    panelFreeTitle: string;
    panelFreeDescription: string;
    panelCompanyEyebrow: string;
    panelCompanyTitle: string;
    panelCompanyDescription: string;
    backendNote: string;
    loadingLabel: string;
  };
  tests: {
    eyebrow: string;
    title: string;
    description: string;
    helper: string;
    cards: TestCardCopy[];
  };
  preview: {
    eyebrow: string;
    title: string;
    description: string;
    freeTitle: string;
    freeItems: string[];
    fullTitle: string;
    fullItems: string[];
    note: string;
  };
  proof: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  };
  saas: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
  whiteLabel: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

const copy: Record<'en' | 'id', CopyShape> = {
  en: {
    hero: {
      badge: 'Start in minutes',
      title: 'Pick a test, enter your email in the flow, and start immediately.',
      description:
        'Launch a DISC, IQ, or workload assessment without a signup wall. We hand you into the existing participant journey so you can move straight from landing page to live test.',
      primaryCta: 'Start Free Test',
      secondaryCta: 'For Companies',
      note: 'Email collection happens inside the participant identity step before the instructions screen.',
      signals: ['No account required', 'Existing /t/:token flow', 'Free snapshot after completion'],
      panelFreeEyebrow: 'Free path',
      panelFreeTitle: 'B2C-first entry',
      panelFreeDescription: 'Start from a public test link, collect identity in-flow, and keep the handoff simple.',
      panelCompanyEyebrow: 'Company path',
      panelCompanyTitle: 'SaaS still available',
      panelCompanyDescription: 'Workspace setup, billing, and managed assessments stay in the secondary path at `/saas`.',
      backendNote: 'No new backend contract is introduced here. This page only points into the session-based participant flow that already exists.',
      loadingLabel: 'Opening test...',
    },
    tests: {
      eyebrow: 'Choose your path',
      title: 'Three quick entry points for personal insight or first-pass screening.',
      description:
        'Each option opens a pre-created public session so the participant flow, instructions, and test runner stay exactly as they work today.',
      helper: 'Pick one test to continue. If you want company administration, teams, billing, or branded delivery, use the SaaS path instead.',
      cards: [
        {
          key: 'disc',
          title: 'DISC',
          description: 'Understand your communication style, pace, and behavioral tendencies.',
          detail: 'Best for team-fit reflection, self-awareness, and communication patterns.',
          cta: 'Start DISC',
          icon: Users,
          accent: 'from-emerald-100 via-white to-emerald-50',
        },
        {
          key: 'iq',
          title: 'IQ',
          description: 'Preview logical reasoning through pattern, numerical, and verbal prompts.',
          detail: 'Useful for early cognitive screening and structured problem-solving checks.',
          cta: 'Start IQ',
          icon: Brain,
          accent: 'from-sky-100 via-white to-indigo-50',
        },
        {
          key: 'workload',
          title: 'Workload',
          description: 'Check perceived mental demand, effort, and current work pressure.',
          detail: 'Built for quick wellbeing snapshots, burnout signals, and workload reflection.',
          cta: 'Start Workload',
          icon: ClipboardList,
          accent: 'from-amber-100 via-white to-rose-50',
        },
      ],
    },
    preview: {
      eyebrow: 'Result positioning',
      title: 'Start free with a useful snapshot, then unlock deeper reporting later.',
      description:
        'The page positions outcomes in two layers for now: a fast free summary for individual users and a fuller report path for paid or company-led usage.',
      freeTitle: 'Free Snapshot',
      freeItems: ['Core score or dominant signal', 'Short summary you can scan fast', 'Simple direction on what to review next'],
      fullTitle: 'Full Report',
      fullItems: ['Detailed interpretation and breakdown', 'Richer report formatting and export path', 'Better fit for paid delivery or company workflows'],
      note: 'This is positioning only for now. No backend result changes are introduced in this release.',
    },
    proof: {
      eyebrow: 'Credibility',
      title: 'The same platform already supports structured delivery for HR teams, campuses, and reviewers.',
      description:
        'This new homepage changes the entry point, not the engine underneath it. The participant path, scoring pipeline, and organization surfaces stay intact.',
      items: ['Public participant flow already live', 'DISC, IQ, and workload sessions already supported', 'SaaS and white-label routes remain available'],
    },
    saas: {
      eyebrow: 'Need company controls?',
      title: 'Use the SaaS route for managed sessions, billing, and workspace operations.',
      description:
        'If you are running assessments for a team or client roster, the existing SaaS landing is still the right place to explain the workspace model.',
      cta: 'Open SaaS Landing',
    },
    whiteLabel: {
      eyebrow: 'Need your own brand?',
      title: 'White-label stays available for consultancies, institutions, and partner delivery.',
      description:
        'Keep the assessment engine while adapting the participant-facing experience to your own organization, workflow, and communication style.',
      cta: 'Explore White-label',
    },
    finalCta: {
      eyebrow: 'Ready to begin?',
      title: 'Start with the free test flow now, or move to the company route when you need more control.',
      description:
        'The fastest path is still the participant journey. Choose a test, continue to `/t/:token`, and let the existing flow handle identity, instructions, and the live session.',
      primaryCta: 'Go to Test Selection',
      secondaryCta: 'See SaaS Option',
    },
  },
  id: {
    hero: {
      badge: 'Mulai dalam hitungan menit',
      title: 'Pilih tes, isi email di alur yang ada, lalu mulai langsung.',
      description:
        'Jalankan asesmen DISC, IQ, atau workload tanpa tembok signup. Halaman ini langsung mengarahkan pengguna ke alur participant yang sudah ada agar dari landing page bisa langsung masuk ke tes.',
      primaryCta: 'Mulai Tes Gratis',
      secondaryCta: 'Untuk Perusahaan',
      note: 'Email dikumpulkan di langkah identitas participant sebelum layar instruksi.',
      signals: ['Tanpa akun', 'Pakai alur /t/:token yang ada', 'Gratis dengan snapshot hasil singkat'],
      panelFreeEyebrow: 'Jalur gratis',
      panelFreeTitle: 'Pintu masuk B2C',
      panelFreeDescription: 'Mulai dari link tes publik, kumpulkan identitas di dalam flow, dan jaga handoff tetap sederhana.',
      panelCompanyEyebrow: 'Jalur perusahaan',
      panelCompanyTitle: 'SaaS tetap tersedia',
      panelCompanyDescription: 'Setup workspace, billing, dan asesmen terkelola tetap ada di jalur sekunder `/saas`.',
      backendNote: 'Tidak ada kontrak backend baru di sini. Halaman ini hanya mengarahkan ke participant flow berbasis session yang sudah ada.',
      loadingLabel: 'Membuka tes...',
    },
    tests: {
      eyebrow: 'Pilih jalur',
      title: 'Tiga pintu masuk cepat untuk insight personal atau screening awal.',
      description:
        'Setiap opsi membuka public session yang sudah tersedia, jadi alur participant, instruksi, dan runner tes tetap bekerja seperti sekarang.',
      helper: 'Pilih satu tes untuk lanjut. Jika butuh administrasi perusahaan, tim, billing, atau delivery bermerek, gunakan jalur SaaS.',
      cards: [
        {
          key: 'disc',
          title: 'DISC',
          description: 'Pahami gaya komunikasi, ritme kerja, dan kecenderungan perilaku Anda.',
          detail: 'Cocok untuk refleksi team-fit, self-awareness, dan pola komunikasi.',
          cta: 'Mulai DISC',
          icon: Users,
          accent: 'from-emerald-100 via-white to-emerald-50',
        },
        {
          key: 'iq',
          title: 'IQ',
          description: 'Lihat gambaran awal kemampuan logika lewat pola, numerik, dan verbal.',
          detail: 'Berguna untuk screening kognitif awal dan cek problem-solving terstruktur.',
          cta: 'Mulai IQ',
          icon: Brain,
          accent: 'from-sky-100 via-white to-indigo-50',
        },
        {
          key: 'workload',
          title: 'Workload',
          description: 'Cek persepsi beban mental, effort, dan tekanan kerja saat ini.',
          detail: 'Dibuat untuk snapshot wellbeing, sinyal burnout, dan refleksi beban kerja.',
          cta: 'Mulai Workload',
          icon: ClipboardList,
          accent: 'from-amber-100 via-white to-rose-50',
        },
      ],
    },
    preview: {
      eyebrow: 'Posisi hasil',
      title: 'Mulai gratis dengan snapshot yang berguna, lalu buka laporan lebih lengkap nanti.',
      description:
        'Untuk sekarang, hasil diposisikan dalam dua lapis: ringkasan gratis yang cepat dibaca untuk individu dan jalur laporan lebih lengkap untuk penggunaan berbayar atau berbasis perusahaan.',
      freeTitle: 'Snapshot Gratis',
      freeItems: ['Skor inti atau sinyal dominan', 'Ringkasan singkat yang cepat dipindai', 'Arahan sederhana untuk tindak lanjut'],
      fullTitle: 'Laporan Lengkap',
      fullItems: ['Interpretasi dan breakdown lebih detail', 'Format laporan dan jalur ekspor yang lebih kaya', 'Lebih cocok untuk delivery berbayar atau workflow perusahaan'],
      note: 'Bagian ini hanya positioning. Tidak ada perubahan backend hasil pada rilis ini.',
    },
    proof: {
      eyebrow: 'Kredibilitas',
      title: 'Platform yang sama sudah dipakai untuk delivery terstruktur oleh tim HR, kampus, dan reviewer.',
      description:
        'Homepage baru ini hanya mengubah titik masuk, bukan mesin di bawahnya. Alur participant, scoring pipeline, dan surface organisasi tetap utuh.',
      items: ['Alur participant publik sudah live', 'Session DISC, IQ, dan workload sudah didukung', 'Rute SaaS dan white-label tetap tersedia'],
    },
    saas: {
      eyebrow: 'Butuh kontrol perusahaan?',
      title: 'Gunakan rute SaaS untuk session terkelola, billing, dan operasi workspace.',
      description:
        'Jika Anda menjalankan asesmen untuk tim atau roster klien, landing SaaS yang lama tetap menjadi tempat terbaik untuk menjelaskan model workspace.',
      cta: 'Buka Landing SaaS',
    },
    whiteLabel: {
      eyebrow: 'Butuh brand sendiri?',
      title: 'White-label tetap tersedia untuk konsultan, institusi, dan delivery partner.',
      description:
        'Pertahankan engine asesmen sambil menyesuaikan pengalaman participant dengan organisasi, workflow, dan gaya komunikasi Anda sendiri.',
      cta: 'Lihat White-label',
    },
    finalCta: {
      eyebrow: 'Siap mulai?',
      title: 'Mulai dari alur tes gratis sekarang, atau pindah ke jalur perusahaan saat butuh kontrol lebih.',
      description:
        'Jalur tercepat tetap participant journey. Pilih tes, lanjut ke `/t/:token`, lalu biarkan flow yang ada menangani identitas, instruksi, dan sesi live.',
      primaryCta: 'Ke Pilihan Tes',
      secondaryCta: 'Lihat Opsi SaaS',
    },
  },
};

const revealTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

function MotionSection({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
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
  const navigate = useNavigate();
  const [loadingTest, setLoadingTest] = useState<TestKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = copy[language];

  function handleStartTest(test: TestKey) {
    setLoadingTest(test);

    startTransition(() => {
      navigate(`/t/${TEST_SESSION_MAP[test]}`);
    });
  }

  return (
    <main className="overflow-hidden">
      <section className="relative isolate overflow-hidden px-6 pb-20 pt-16 sm:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(240,249,255,0.84)_34%,rgba(255,251,235,0.72)_100%)]" />
        <motion.div
          className="absolute left-[-5rem] top-12 h-56 w-56 rounded-full bg-sky-200/55 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
          transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-3rem] top-24 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 18, 0] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.05 }}
          >
            <Badge className="border-white/80 bg-white/85 text-slate-600 shadow-sm">{t.hero.badge}</Badge>
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[4.4rem] lg:leading-[0.95]">
                {t.hero.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{t.hero.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="gap-2" asChild>
                <a href="#tests">
                  {t.hero.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/saas">{t.hero.secondaryCta}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {t.hero.signals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-white/75 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm"
                >
                  {signal}
                </span>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-[28px] border border-white/70 bg-white/72 p-5 text-sm leading-7 text-slate-600 shadow-sm backdrop-blur">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-950" />
              <p>{t.hero.note}</p>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...revealTransition, delay: 0.14 }}
          >
            <div className="overflow-hidden rounded-[38px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_40px_120px_-70px_rgba(15,23,42,0.82)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.hero.panelFreeEyebrow}</p>
                  <p className="mt-3 text-2xl font-semibold">{t.hero.panelFreeTitle}</p>
                  <p className="mt-3 text-sm leading-7 text-white/72">{t.hero.panelFreeDescription}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.hero.panelCompanyEyebrow}</p>
                  <p className="mt-3 text-2xl font-semibold">{t.hero.panelCompanyTitle}</p>
                  <p className="mt-3 text-sm leading-7 text-white/72">{t.hero.panelCompanyDescription}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'DISC', value: TEST_SESSION_MAP.disc, icon: Users },
                  { label: 'IQ', value: TEST_SESSION_MAP.iq, icon: Brain },
                  { label: 'Workload', value: TEST_SESSION_MAP.workload, icon: ClipboardList },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/10 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-lg font-semibold">{item.label}</p>
                      <p className="mt-2 text-sm text-white/60">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-7 text-white/75">{t.hero.backendNote}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <MotionSection id="tests" className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.44fr_0.56fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.tests.eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t.tests.title}</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm leading-7 text-slate-600">{t.tests.description}</p>
            <p className="text-sm leading-7 text-slate-500">{t.tests.helper}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {t.tests.cards.map((item, index) => {
            const Icon = item.icon;
            const isLoading = isPending && loadingTest === item.key;

            return (
              <motion.button
                key={item.key}
                type="button"
                onClick={() => handleStartTest(item.key)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: index * 0.08 }}
                className={cn(
                  'group flex h-full flex-col justify-between rounded-[34px] border border-slate-200/80 bg-gradient-to-br p-6 text-left shadow-[0_24px_80px_-58px_rgba(15,23,42,0.48)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_90px_-56px_rgba(15,23,42,0.42)]',
                  item.accent,
                )}
              >
                <div className="space-y-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                    <p className="text-sm leading-7 text-slate-500">{item.detail}</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-950 shadow-sm">
                  <span>{isLoading ? t.hero.loadingLabel : item.cta}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[0.48fr_0.52fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.preview.eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t.preview.title}</h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600">{t.preview.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950">{t.preview.freeTitle}</h3>
              </div>
              <div className="mt-5 space-y-3">
                {t.preview.freeItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-900 bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{t.preview.fullTitle}</h3>
              </div>
              <div className="mt-5 space-y-3">
                {t.preview.fullItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/78">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-500">{t.preview.note}</p>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="rounded-[36px] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.92)_56%,rgba(236,253,245,0.82))] p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.58fr_0.42fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.proof.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{t.proof.title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">{t.proof.description}</p>
            </div>
            <div className="space-y-3">
              {t.proof.items.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-950" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="rounded-[34px] border border-slate-900 bg-slate-950 p-8 text-white shadow-[0_34px_100px_-70px_rgba(15,23,42,0.86)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.saas.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.saas.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">{t.saas.description}</p>
          <Button variant="secondary" size="lg" className="mt-8 bg-white text-slate-950 hover:bg-white/92" asChild>
            <Link to="/saas">{t.saas.cta}</Link>
          </Button>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="rounded-[34px] border border-slate-200/80 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.whiteLabel.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t.whiteLabel.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{t.whiteLabel.description}</p>
          <Button variant="outline" size="lg" className="mt-8 border-slate-200 bg-slate-50 hover:bg-white" asChild>
            <Link to="/white-label">
              <Building2 className="mr-2 h-4 w-4" />
              {t.whiteLabel.cta}
            </Link>
          </Button>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-16 pb-24">
        <div className="rounded-[38px] border border-slate-200/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94)_54%,rgba(224,231,255,0.68))] p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.58fr_0.42fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t.finalCta.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t.finalCta.title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">{t.finalCta.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Button size="lg" className="gap-2" asChild>
                <a href="#tests">
                  {t.finalCta.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/saas">{t.finalCta.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </MotionSection>
    </main>
  );
}
