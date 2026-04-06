import { Link, Outlet } from 'react-router-dom';

import { LanguageToggle } from '@/components/common/language-toggle';
import { useLanguage } from '@/lib/language';

const copy = {
  en: {
    brand: 'Vanaila Psikotest',
    footerPrimary: 'Digital psychological assessments for organizations, researchers, reviewers, and education teams.',
    footerSecondary: 'Built for structured administration, automated scoring, professional reports, and white-label deployment.',
    nav: {
      howItWorks: 'How It Works',
      assessmentTypes: 'Assessment Types',
      manual: 'Manual',
      faq: 'FAQ',
      tryDemo: 'Try Demo',
      whiteLabel: 'White-label',
      signUp: 'Sign Up',
    },
  },
  id: {
    brand: 'Vanaila Psikotest',
    footerPrimary: 'Asesmen psikologis digital untuk organisasi, peneliti, reviewer, dan tim pendidikan.',
    footerSecondary: 'Dirancang untuk administrasi yang terstruktur, scoring otomatis, laporan profesional, dan model white-label.',
    nav: {
      howItWorks: 'Cara Kerja',
      assessmentTypes: 'Jenis Asesmen',
      manual: 'Panduan',
      faq: 'FAQ',
      tryDemo: 'Coba Demo',
      whiteLabel: 'White-label',
      signUp: 'Daftar',
    },
  },
} as const;

export function MarketingLayout() {
  const { language } = useLanguage();
  const t = copy[language];

  const footerLinks = [
    { label: 'SaaS', to: '/saas' },
    { label: t.nav.manual, to: '/manual' },
    { label: t.nav.whiteLabel, to: '/white-label' },
    { label: t.nav.tryDemo, to: '/t/disc-public-001' },
    { label: t.nav.signUp, to: '/signup' },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdfdfd_0%,#f5f6f8_40%,#eef2f7_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            {t.brand}
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
            <nav className="flex items-center gap-6">
              <a href="/saas#how-it-works">{t.nav.howItWorks}</a>
              <a href="/saas#assessment-types">{t.nav.assessmentTypes}</a>
              <Link to="/manual" className="transition hover:text-slate-950">
                {t.nav.manual}
              </Link>
              <a href="/saas#faq">{t.nav.faq}</a>
              <Link to="/t/disc-public-001" className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-slate-950">
                {t.nav.tryDemo}
              </Link>
              <Link
                to="/white-label"
                className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
              >
                {t.nav.whiteLabel}
              </Link>
              <Link to="/signup" className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm transition hover:bg-slate-900">
                {t.nav.signUp}
              </Link>
            </nav>
            <LanguageToggle />
          </div>
          <div className="md:hidden">
            <LanguageToggle />
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-white/60 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-2 text-sm text-slate-500">
            <p>{t.footerPrimary}</p>
            <p>{t.footerSecondary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
