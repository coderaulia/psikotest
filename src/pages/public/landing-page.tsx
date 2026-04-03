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
      badge: 'Ready in Minutes',
      title: 'Psychological Assessments — Ready in Minutes',
      description:
        'Start a DISC, IQ, or workload assessment instantly. No signup wall — enter your details in the flow and go straight to the test.',
      primaryCta: 'Start Free Test',
      secondaryCta: 'For Companies →',
      note: 'No account required • 10–15 minutes • Instant snapshot',
      signals: [
        'No signup required',
        'Direct access via /t/:token flow',
        'Identity collected during the test process',
        'Free snapshot available after completion',
      ],
      panelFreeEyebrow: 'Pick a test and begin immediately',
      panelFreeTitle: 'Free Path — Individual Use',
      panelFreeDescription:
        'Start from a public test and get a quick, structured snapshot of your results. Instant access, minimal friction, built for self-awareness.',
      panelCompanyEyebrow: 'Managed Assessments',
      panelCompanyTitle: 'Company Path',
      panelCompanyDescription:
        'Run structured assessments for teams, candidates, or research. Workspace & team management, billing & reporting. 👉 Available at /saas',
      backendNote: 'The experience uses the same participant journey trusted by teams and organizations.',
      loadingLabel: 'Opening test...',
    },
    tests: {
      eyebrow: 'Choose your assessment',
      title: 'Three structured entry points for personal insight or first-pass screening.',
      description: 'Each test uses a pre-configured session and the existing participant flow.',
      helper:
        'Choose a test, enter your email inside the flow, and continue directly into the live session.',
      cards: [
        {
          key: 'disc',
          title: 'DISC Personality',
          description: 'Understand how you communicate, respond, and behave under pressure.',
          detail: 'Communication style and tendencies • Team-fit and behavioral insight • Widely used in HR and coaching',
          cta: 'Start DISC',
          icon: Users,
          accent: 'from-emerald-100 via-white to-emerald-50',
        },
        {
          key: 'iq',
          title: 'IQ / Cognitive Ability',
          description: 'Preview logical reasoning across pattern, numerical, and verbal tasks.',
          detail: 'Structured cognitive signals • Early-stage screening support • Problem-solving orientation',
          cta: 'Start IQ',
          icon: Brain,
          accent: 'from-sky-100 via-white to-indigo-50',
        },
        {
          key: 'workload',
          title: 'Workload / Stress',
          description: 'Evaluate mental demand, effort, and perceived workload.',
          detail: 'Quick wellbeing snapshot • Detect workload pressure • Useful for productivity reflection',
          cta: 'Start Workload',
          icon: ClipboardList,
          accent: 'from-amber-100 via-white to-rose-50',
        },
      ],
    },
    preview: {
      eyebrow: 'Result Positioning',
      title: 'Start free — go deeper when needed',
      description: 'Results are delivered in two layers:',
      freeTitle: 'Free Snapshot',
      freeItems: [
        'Core score or dominant profile',
        'Short, scannable summary',
        'Direction for next steps',
      ],
      fullTitle: 'Full Report (Professional Use)',
      fullItems: [
        'Detailed breakdown and interpretation',
        'Richer report structure',
        'Export-ready format',
        'Suitable for company workflows',
      ],
      note: 'The landing page changes the entry point — not the system behind it.',
    },
    proof: {
      eyebrow: 'Credibility',
      title: 'Built for real assessment use',
      description:
        'This is not a casual quiz experience. The platform already supports structured delivery for HR teams, recruitment workflows, and academic use.',
      items: [
        'Existing participant flow in production',
        'DISC, IQ, and workload supported',
        'Scoring and reporting pipeline already active',
      ],
    },
    saas: {
      eyebrow: 'Need to manage assessments at scale?',
      title: 'Open SaaS Platform',
      description:
        'Use the platform to create sessions, invite participants, and manage results in one place.',
      cta: 'Go to SaaS Platform',
    },
    whiteLabel: {
      eyebrow: 'Want your own branded platform?',
      title: 'Explore White-label',
      description: 'Deliver assessments under your own brand while using the same engine.',
      cta: 'See White-label',
    },
    finalCta: {
      eyebrow: 'Ready to start?',
      title: 'Pick a test and continue directly into the assessment flow.',
      description: 'No setup needed.',
      primaryCta: 'Start Free Test',
      secondaryCta: 'For Companies',
    },
  },
  id: {
    hero: {
      badge: 'Siap dalam Hitungan Menit',
      title: 'Asesmen Psikologi — Beres dalam Hitungan Menit',
      description:
        'Mulai asesmen DISC, IQ, atau beban kerja sekarang juga. Tanpa ribet daftar — isi data diri langsung di dalam tes dan mulai sesinya.',
      primaryCta: 'Mulai Tes Gratis',
      secondaryCta: 'Untuk Perusahaan →',
      note: 'Tanpa akun • 10–15 menit • Hasil instan',
      signals: [
        'Gak perlu daftar akun',
        'Akses langsung via /t/:token',
        'Data diri diisi pas lagi tes',
        'Snapshot hasil gratis setelah selesai',
      ],
      panelFreeEyebrow: 'Pilih tes dan langsung mulai',
      panelFreeTitle: 'Jalur Gratis — Untuk Individu',
      panelFreeDescription:
        'Mulai dari tes publik dan dapatkan gambaran hasil yang cepat & terstruktur. Akses instan, gak ribet, pas buat kenal diri sendiri.',
      panelCompanyEyebrow: 'Asesmen Terkelola',
      panelCompanyTitle: 'Jalur Perusahaan',
      panelCompanyDescription:
        'Jalankan asesmen terstruktur buat tim, kandidat, atau riset. Manajemen tim, workspace, billing & laporan. 👉 Tersedia di /saas',
      backendNote: 'Pengalaman yang sama dengan yang dipercayai oleh berbagai tim dan organisasi.',
      loadingLabel: 'Membuka tes...',
    },
    tests: {
      eyebrow: 'Pilih asesmen kamu',
      title: 'Tiga titik masuk terstruktur untuk wawasan pribadi atau screening awal.',
      description: 'Setiap tes menggunakan sesi yang sudah dikonfigurasi dan alur peserta yang sudah ada.',
      helper: 'Pilih asesmen, isi email di dalam flow, dan lanjut langsung ke sesi live.',
      cards: [
        {
          key: 'disc',
          title: 'Kepribadian DISC',
          description: 'Pahami cara kamu berkomunikasi, merespons, dan berperilaku di bawah tekanan.',
          detail: 'Gaya dan kecenderungan komunikasi • Kecocokan tim dan wawasan perilaku • Banyak dipakai di HR dan coaching',
          cta: 'Mulai DISC',
          icon: Users,
          accent: 'from-emerald-100 via-white to-emerald-50',
        },
        {
          key: 'iq',
          title: 'IQ / Kemampuan Kognitif',
          description: 'Lihat gambaran penalaran logis lewat tugas pola, numerik, dan verbal.',
          detail: 'Sinyal kognitif terstruktur • Dukungan screening tahap awal • Orientasi pemecahan masalah',
          cta: 'Mulai IQ',
          icon: Brain,
          accent: 'from-sky-100 via-white to-indigo-50',
        },
        {
          key: 'workload',
          title: 'Beban Kerja / Stres',
          description: 'Evaluasi tuntutan mental, usaha, dan persepsi beban kerja.',
          detail: 'Snapshot cepat kesejahteraan diri • Deteksi tekanan beban kerja • Berguna untuk refleksi produktivitas',
          cta: 'Mulai Workload',
          icon: ClipboardList,
          accent: 'from-amber-100 via-white to-rose-50',
        },
      ],
    },
    preview: {
      eyebrow: 'Posisi Hasil',
      title: 'Mulai gratis — gali lebih dalam saat butuh',
      description: 'Hasil dikirimkan dalam dua lapisan:',
      freeTitle: 'Snapshot Gratis',
      freeItems: [
        'Skor inti atau profil dominan',
        'Ringkasan singkat yang gampang dibaca',
        'Arahan untuk langkah selanjutnya',
      ],
      fullTitle: 'Laporan Lengkap (Profesional)',
      fullItems: [
        'Breakdown dan interpretasi detail',
        'Struktur laporan lebih kaya',
        'Format siap ekspor',
        'Cocok untuk alur kerja perusahaan',
      ],
      note: 'Landing page ini cuma ganti pintu masuknya — sistem di belakangnya tetap sama tangguhnya.',
    },
    proof: {
      eyebrow: 'Kredibilitas',
      title: 'Dibuat untuk asesmen sungguhan',
      description:
        'Ini bukan sekadar kuis santai. Platform ini sudah mendukung pengiriman terstruktur untuk tim HR, alur rekrutmen, dan penggunaan akademik.',
      items: [
        'Alur peserta sudah live di produksi',
        'Mendukung DISC, IQ, dan beban kerja',
        'Pipa penilaian dan pelaporan sudah aktif',
      ],
    },
    saas: {
      eyebrow: 'Butuh kelola asesmen skala besar?',
      title: 'Buka Platform SaaS',
      description: 'Gunakan platform untuk membuat sesi, undang peserta, dan kelola hasil di satu tempat.',
      cta: 'Ke Platform SaaS',
    },
    whiteLabel: {
      eyebrow: 'Mau platform dengan brand sendiri?',
      title: 'Jelajahi White-label',
      description: 'Kirim asesmen dengan brand kamu sendiri sambil tetap pakai engine yang sama.',
      cta: 'Lihat White-label',
    },
    finalCta: {
      eyebrow: 'Siap buat mulai?',
      title: 'Pilih tes dan langsung lanjut ke alur asesmen.',
      description: 'Gak perlu setup apa pun.',
      primaryCta: 'Mulai Tes Gratis',
      secondaryCta: 'Untuk Perusahaan',
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
