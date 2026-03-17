import type { ReactNode } from 'react';

import { ArrowRight, LogOut, Sparkles } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { LanguageToggle } from '@/components/common/language-toggle';
import { loadCustomerSession } from '@/lib/customer-session';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/language';
import { logoutCustomerSession } from '@/services/customer-api';

const copy = {
  en: {
    brand: 'Vanaila Psikotest',
    workspaceTitle: 'Customer workspace',
    nav: {
      workspace: 'Workspace',
      createAssessment: 'Create Assessment',
      settings: 'Settings',
      signOut: 'Sign out',
    },
    hero: {
      badge: 'Guided onboarding',
      title: 'Create assessment drafts before you publish or upgrade.',
      description:
        'Set the purpose, participant cap, and visibility model first. The participant link is prepared during onboarding and can be activated later.',
      currentAccess: 'Current customer access',
      currentAccessDescription:
        'Trial workspaces can prepare assessment drafts and preview the participant experience before sharing externally.',
      createDraft: 'Create a new draft',
      workspaceFallback: 'Workspace',
    },
  },
  id: {
    brand: 'Vanaila Psikotest',
    workspaceTitle: 'Workspace pelanggan',
    nav: {
      workspace: 'Workspace',
      createAssessment: 'Buat Asesmen',
      settings: 'Pengaturan',
      signOut: 'Keluar',
    },
    hero: {
      badge: 'Onboarding terpandu',
      title: 'Buat draft asesmen sebelum dipublikasikan atau di-upgrade.',
      description:
        'Atur tujuan, batas peserta, dan model visibilitas terlebih dahulu. Link peserta disiapkan saat onboarding dan bisa diaktifkan nanti.',
      currentAccess: 'Akses pelanggan saat ini',
      currentAccessDescription:
        'Workspace trial dapat menyiapkan draft asesmen dan meninjau pengalaman peserta sebelum dibagikan ke luar.',
      createDraft: 'Buat draft baru',
      workspaceFallback: 'Workspace',
    },
  },
} as const;

export function CustomerShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const customerSession = loadCustomerSession();
  const { language } = useLanguage();
  const t = copy[language];

  const navItems = [
    { to: '/workspace', label: t.nav.workspace },
    { to: '/workspace/create', label: t.nav.createAssessment },
    { to: '/workspace/settings', label: t.nav.settings },
  ];

  async function handleLogout() {
    await logoutCustomerSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f7fb_45%,#e8eef7_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.24em] text-slate-400">
              {t.brand}
            </Link>
            <p className="mt-1 text-lg font-semibold">{t.workspaceTitle}</p>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/workspace'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-950/5 hover:text-slate-950',
                    isActive && 'bg-slate-950 text-white hover:bg-slate-950 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden md:inline-flex" />
            <div className="hidden rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-500 lg:block">
              {customerSession?.account.organizationName ?? customerSession?.account.email ?? t.hero.workspaceFallback}
            </div>
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              <LogOut className="h-4 w-4" />
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex justify-end md:hidden">
          <LanguageToggle />
        </div>
        <div className="mb-8 grid gap-4 rounded-[32px] border border-white/70 bg-white/74 p-6 shadow-panel backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              {t.hero.badge}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{t.hero.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">{t.hero.description}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-medium text-slate-950">{t.hero.currentAccess}</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t.hero.currentAccessDescription}</p>
            <Link to="/workspace/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-950">
              {t.hero.createDraft} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
