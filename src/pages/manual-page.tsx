import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
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
import { useLanguage } from '@/lib/language';

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

const copy = {
  en: {
    heroBadge: 'Product Manual',
    heroTitle: 'A practical guide for participants, companies, and psychologists.',
    heroDesc:
      'This manual explains how each role uses the platform, from opening a participant link to reviewing and releasing a professional report.',
    ctaCreate: 'Create Workspace',
    ctaWhiteLabel: 'Explore White-label',
    usageEyebrow: 'Usage tracks',
    usageTitle: 'Choose the workflow that matches your role',
    usageDesc:
      'Each audience uses the same platform differently, so this manual is organized by real operational journeys, not just by features.',
    checklistTitle: 'Recommended checklist',
    notesEyebrow: 'Operational notes',
    notesTitle: 'Important guidance before wider rollout',
    notesDesc:
      'These notes help teams align platform usage with internal process, reviewer standards, and participant communication.',
    finalEyebrow: 'Need a branded deployment?',
    finalTitle: 'Use the same platform as your own operational experience.',
    finalDesc:
      'If you need a private branded version for a company, consultancy, or research lab, the white-label model lets the platform adapt to your identity and workflow.',
    finalWhiteLabel: 'See White-label',
    finalSaas: 'Start With SaaS',
    openGuide: 'Open guide',
  },
  id: {
    heroBadge: 'Panduan Produk',
    heroTitle: 'Panduan praktis buat peserta, tim perusahaan, dan psikolog.',
    heroDesc:
      'Di sini kamu bisa lihat alur tiap peran, mulai dari buka link peserta sampai review dan rilis laporan profesional.',
    ctaCreate: 'Buat Workspace',
    ctaWhiteLabel: 'Lihat White-label',
    usageEyebrow: 'Alur penggunaan',
    usageTitle: 'Pilih alur yang paling pas sama peranmu',
    usageDesc:
      'Setiap audiens pakai platform ini dengan cara yang beda, jadi panduannya disusun berdasarkan alur kerja nyata, bukan sekadar daftar fitur.',
    checklistTitle: 'Checklist yang disarankan',
    notesEyebrow: 'Catatan operasional',
    notesTitle: 'Hal penting sebelum dipakai lebih luas',
    notesDesc:
      'Catatan ini bantu tim menyamakan penggunaan platform dengan proses internal, standar reviewer, dan komunikasi ke peserta.',
    finalEyebrow: 'Butuh versi ber-brand sendiri?',
    finalTitle: 'Pakai platform yang sama tapi tetap berasa produk kamu sendiri.',
    finalDesc:
      'Kalau kamu butuh versi privat untuk perusahaan, konsultan, atau lab riset, model white-label bisa disesuaikan sama identitas dan alur kerja kamu.',
    finalWhiteLabel: 'Lihat White-label',
    finalSaas: 'Mulai dengan SaaS',
    openGuide: 'Buka panduan',
  },
} as const;

const tracksByLanguage: Record<'en' | 'id', ManualTrack[]> = {
  en: [
    {
      id: 'public-flow',
      label: 'Public Test Flow',
      title: 'How anyone can start a test immediately',
      description:
        'The public flow is the fastest way to experience the assessment engine. It skips workspace setup and invitation management.',
      icon: Sparkles,
      accentClass:
        'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
      steps: [
        { step: '01', title: 'Visit landing page', detail: 'Open the homepage and browse the available public assessments.' },
        { step: '02', title: 'Choose your test', detail: 'Pick DISC, IQ, or Workload based on what you want to evaluate.' },
        { step: '03', title: 'Fill identity', detail: 'Enter your basic data so your session and final result are tied to your profile.' },
        { step: '04', title: 'Finish the assessment', detail: 'Follow instructions and answer all items in the provided flow.' },
        { step: '05', title: 'Read your result', detail: 'You will get instant summary or wait for reviewer release depending on session policy.' },
      ],
      checklist: ['Tests available: DISC, IQ, Workload', 'Free mode: Basic summary', 'Full mode: Detailed interpretation', 'Need company features? Open /saas', 'Need branding? Open /white-label'],
    },
    {
      id: 'super-admin',
      label: 'Platform Manager Guide',
      title: 'How a Super Admin operates the SaaS',
      description:
        'Super admins manage global platform settings, customer workspaces, and account access policies.',
      icon: ShieldCheck,
      accentClass:
        'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,252,232,0.94)_58%,rgba(254,249,195,0.76))]',
      steps: [
        { step: '01', title: 'Sign in to admin console', detail: 'Use authorized admin credentials to enter the protected platform panel.' },
        { step: '02', title: 'Manage customer accounts', detail: 'Review customer workspaces, activity trends, and usage indicators.' },
        { step: '03', title: 'Control workspace status', detail: 'Activate or deactivate workspaces based on billing or compliance decisions.' },
        { step: '04', title: 'Adjust global defaults', detail: 'Update platform-level defaults and keep global policy settings aligned.' },
        { step: '05', title: 'Monitor reviewer queue', detail: 'Track review workloads and reassign blocked assessments when needed.' },
      ],
      checklist: ['Keep admin credentials private', 'Review audit logs routinely', 'Communicate account status changes clearly'],
    },
    {
      id: 'participant',
      label: 'Participant Guide',
      title: 'How participants move through an assessment',
      description:
        'The participant journey is calm and guided: consent first, then identity, then the assessment itself.',
      icon: Users,
      accentClass:
        'border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96)_58%,rgba(219,234,254,0.78))]',
      steps: [
        { step: '01', title: 'Open participant link', detail: 'Participants enter through the private link shared by admin or reviewer.' },
        { step: '02', title: 'Read consent info', detail: 'The flow shows assessment purpose, privacy policy, and contact person first.' },
        { step: '03', title: 'Fill identity form', detail: 'Required fields depend on session configuration and reporting needs.' },
        { step: '04', title: 'Complete test flow', detail: 'Participants read instructions, then answer questions in the test interface.' },
        { step: '05', title: 'Submit and await policy', detail: 'Some sessions show instant summary, others wait for reviewer release.' },
      ],
      checklist: ['Use stable internet', 'Read consent carefully', 'Avoid refreshing during test'],
    },
    {
      id: 'company',
      label: 'Company and Research Workspace',
      title: 'How organizations and researchers run assessments',
      description:
        'Workspaces are used to draft, preview, and activate sessions only when the flow is ready.',
      icon: Building2,
      accentClass:
        'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
      steps: [
        { step: '01', title: 'Create workspace', detail: 'Register and open your operational dashboard for assessments and reports.' },
        { step: '02', title: 'Create first assessment', detail: 'Pick test type and define purpose, organization identity, and session setup.' },
        { step: '03', title: 'Configure session policy', detail: 'Set limits, visibility mode, and delivery options before sharing.' },
        { step: '04', title: 'Preview participant journey', detail: 'Check consent page, identity form, and item flow before activation.' },
        { step: '05', title: 'Activate and monitor', detail: 'Share participant link, monitor progress, and review results from workspace.' },
      ],
      checklist: ['Confirm result visibility policy', 'Review consent wording', 'Validate participant limits before launch'],
    },
    {
      id: 'psychologist',
      label: 'Psychologist and Reviewer Guide',
      title: 'How reviewers handle professional interpretation',
      description:
        'Review-required mode separates automatic scoring from final interpretation release.',
      icon: Stethoscope,
      accentClass:
        'border-violet-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94)_58%,rgba(233,213,255,0.62))]',
      steps: [
        { step: '01', title: 'Open reviewer queue', detail: 'Reviewers see newly scored results waiting for professional follow-up.' },
        { step: '02', title: 'Inspect context', detail: 'Open participant metadata, session details, and score breakdowns first.' },
        { step: '03', title: 'Write interpretation', detail: 'Add professional summary, recommendation, and limitation notes.' },
        { step: '04', title: 'Release result', detail: 'Move status to reviewed/released so the correct audience can access it.' },
        { step: '05', title: 'Audit and follow up', detail: 'Track release actions and reviewer decisions for operational accountability.' },
      ],
      checklist: ['Review before release', 'Keep limitations explicit', 'Use release status intentionally'],
    },
  ],
  id: [
    {
      id: 'public-flow',
      label: 'Alur Tes Publik',
      title: 'Cara siapa pun bisa mulai tes langsung',
      description:
        'Alur publik adalah cara paling cepat buat nyobain mesin asesmen. Tidak perlu setup workspace dan manajemen undangan.',
      icon: Sparkles,
      accentClass:
        'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
      steps: [
        { step: '01', title: 'Buka landing page', detail: 'Masuk ke halaman utama lalu lihat opsi asesmen publik yang tersedia.' },
        { step: '02', title: 'Pilih jenis tes', detail: 'Pilih DISC, IQ, atau Workload sesuai kebutuhan evaluasi.' },
        { step: '03', title: 'Isi identitas', detail: 'Masukkan data dasar supaya sesi dan hasilmu terhubung ke profil yang benar.' },
        { step: '04', title: 'Selesaikan asesmen', detail: 'Ikuti instruksi dan isi semua item pada alur tes yang disediakan.' },
        { step: '05', title: 'Lihat hasil', detail: 'Kamu bisa dapat ringkasan instan atau menunggu rilis reviewer tergantung kebijakan sesi.' },
      ],
      checklist: ['Tes tersedia: DISC, IQ, Workload', 'Mode gratis: Ringkasan dasar', 'Mode penuh: Interpretasi detail', 'Perlu fitur perusahaan? Buka /saas', 'Perlu branding sendiri? Buka /white-label'],
    },
    {
      id: 'super-admin',
      label: 'Panduan Platform Manager',
      title: 'Cara Super Admin mengelola SaaS',
      description:
        'Super admin mengelola pengaturan global platform, workspace customer, dan kebijakan akses akun.',
      icon: ShieldCheck,
      accentClass:
        'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,252,232,0.94)_58%,rgba(254,249,195,0.76))]',
      steps: [
        { step: '01', title: 'Masuk ke admin console', detail: 'Gunakan kredensial admin resmi untuk masuk ke panel platform yang terlindungi.' },
        { step: '02', title: 'Kelola akun customer', detail: 'Pantau workspace customer, tren aktivitas, dan indikator pemakaian.' },
        { step: '03', title: 'Atur status workspace', detail: 'Aktifkan atau nonaktifkan workspace sesuai kebijakan billing atau compliance.' },
        { step: '04', title: 'Atur default global', detail: 'Perbarui default platform dan pastikan kebijakan global tetap sinkron.' },
        { step: '05', title: 'Pantau antrian reviewer', detail: 'Lihat beban review dan bantu re-assign asesmen yang terhambat.' },
      ],
      checklist: ['Simpan kredensial admin secara privat', 'Cek audit log secara rutin', 'Komunikasikan perubahan status akun dengan jelas'],
    },
    {
      id: 'participant',
      label: 'Panduan Peserta',
      title: 'Cara peserta menjalani asesmen',
      description:
        'Perjalanan peserta dibuat tenang dan jelas: consent dulu, lanjut identitas, baru masuk tes.',
      icon: Users,
      accentClass:
        'border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96)_58%,rgba(219,234,254,0.78))]',
      steps: [
        { step: '01', title: 'Buka link peserta', detail: 'Peserta masuk lewat link privat yang dibagikan admin atau reviewer.' },
        { step: '02', title: 'Baca info consent', detail: 'Sistem menampilkan tujuan asesmen, privasi, dan kontak penanggung jawab terlebih dulu.' },
        { step: '03', title: 'Isi form identitas', detail: 'Field yang diminta mengikuti konfigurasi sesi dan kebutuhan laporan.' },
        { step: '04', title: 'Kerjakan tes', detail: 'Peserta baca instruksi lalu menjawab pertanyaan di antarmuka tes.' },
        { step: '05', title: 'Kirim dan tunggu kebijakan hasil', detail: 'Sebagian sesi langsung tampilkan ringkasan, sebagian menunggu rilis reviewer.' },
      ],
      checklist: ['Pakai koneksi internet yang stabil', 'Baca consent dengan teliti', 'Hindari refresh saat tes berjalan'],
    },
    {
      id: 'company',
      label: 'Workspace Perusahaan dan Riset',
      title: 'Cara organisasi dan peneliti menjalankan asesmen',
      description:
        'Workspace dipakai untuk bikin draft, preview alur, lalu aktivasi sesi saat semuanya sudah siap.',
      icon: Building2,
      accentClass:
        'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94)_58%,rgba(220,252,231,0.76))]',
      steps: [
        { step: '01', title: 'Buat workspace', detail: 'Daftar lalu buka dashboard operasional untuk asesmen dan laporan.' },
        { step: '02', title: 'Buat asesmen pertama', detail: 'Pilih jenis tes dan tentukan tujuan, identitas organisasi, serta setup sesi.' },
        { step: '03', title: 'Atur kebijakan sesi', detail: 'Set limit, mode visibilitas hasil, dan opsi delivery sebelum dibagikan.' },
        { step: '04', title: 'Preview perjalanan peserta', detail: 'Cek halaman consent, form identitas, dan alur item sebelum aktivasi.' },
        { step: '05', title: 'Aktifkan dan pantau', detail: 'Bagikan link peserta, monitor progres, dan review hasil dari workspace.' },
      ],
      checklist: ['Pastikan kebijakan visibilitas hasil', 'Review wording consent', 'Validasi limit peserta sebelum launch'],
    },
    {
      id: 'psychologist',
      label: 'Panduan Psikolog dan Reviewer',
      title: 'Cara reviewer menangani interpretasi profesional',
      description:
        'Mode review-required memisahkan scoring otomatis dari rilis interpretasi final.',
      icon: Stethoscope,
      accentClass:
        'border-violet-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94)_58%,rgba(233,213,255,0.62))]',
      steps: [
        { step: '01', title: 'Buka reviewer queue', detail: 'Reviewer melihat hasil baru yang menunggu tindak lanjut profesional.' },
        { step: '02', title: 'Tinjau konteks', detail: 'Baca metadata peserta, detail sesi, dan breakdown skor lebih dulu.' },
        { step: '03', title: 'Tulis interpretasi', detail: 'Tambahkan ringkasan profesional, rekomendasi, dan batasan interpretasi.' },
        { step: '04', title: 'Rilis hasil', detail: 'Ubah status ke reviewed/released supaya audiens yang tepat bisa akses hasil.' },
        { step: '05', title: 'Audit dan tindak lanjut', detail: 'Lacak aksi rilis dan keputusan reviewer untuk akuntabilitas operasional.' },
      ],
      checklist: ['Review dulu sebelum rilis', 'Tuliskan batasan dengan jelas', 'Pakai status rilis secara disiplin'],
    },
  ],
};

const supportNotesByLanguage = {
  en: [
    {
      title: 'Result visibility follows session policy',
      description:
        'Instant-summary mode and review-required mode behave differently. Confirm which policy is active before distribution.',
      icon: ShieldCheck,
    },
    {
      title: 'Keep participant links private',
      description:
        'Assessment links are intended for target participants only. Avoid sharing them outside the planned workflow.',
      icon: ClipboardCheck,
    },
    {
      title: 'Manual and governance should work together',
      description:
        'This guide explains platform flow. Assessment quality, reviewer standards, and institutional compliance still need active governance.',
      icon: BookOpen,
    },
  ],
  id: [
    {
      title: 'Visibilitas hasil mengikuti kebijakan sesi',
      description:
        'Mode ringkasan instan dan mode review-required punya perilaku berbeda. Pastikan mode aktif sebelum distribusi link.',
      icon: ShieldCheck,
    },
    {
      title: 'Jaga link peserta tetap privat',
      description:
        'Link asesmen ditujukan untuk peserta yang memang ditargetkan. Hindari dibagikan di luar alur yang direncanakan.',
      icon: ClipboardCheck,
    },
    {
      title: 'Panduan dan tata kelola harus jalan bareng',
      description:
        'Panduan ini menjelaskan alur platform. Kualitas asesmen, standar reviewer, dan compliance institusi tetap perlu dikendalikan secara aktif.',
      icon: BookOpen,
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

export function ManualPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const manualTracks = tracksByLanguage[language];
  const supportNotes = supportNotesByLanguage[language];

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
            <Badge className="border-white/80 bg-white/80 text-slate-600 shadow-sm">{t.heroBadge}</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[0.95]">
                {t.heroTitle}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{t.heroDesc}</p>
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
                  {t.ctaCreate} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/white-label">{t.ctaWhiteLabel}</Link>
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
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t.usageEyebrow}</p>
                <CardTitle className="text-2xl">{t.usageTitle}</CardTitle>
                <CardDescription className="text-sm leading-7 text-slate-600">{t.usageDesc}</CardDescription>
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
        <SectionHeading eyebrow={t.usageEyebrow} title={t.usageTitle} description={t.usageDesc} />
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
                      {t.openGuide} <ArrowRight className="h-4 w-4" />
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
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.checklistTitle}</p>
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
        <SectionHeading eyebrow={t.notesEyebrow} title={t.notesTitle} description={t.notesDesc} />
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
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">{t.finalEyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight">{t.finalTitle}</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">{t.finalDesc}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" className="justify-center bg-white text-slate-950 hover:bg-white/90" asChild>
                <Link to="/white-label">{t.finalWhiteLabel}</Link>
              </Button>
              <Button size="lg" className="justify-center border border-white/15 bg-white/10 text-white hover:bg-white/15" asChild>
                <Link to="/signup">{t.finalSaas}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MotionSection>
    </main>
  );
}
