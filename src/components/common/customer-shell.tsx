import type { ReactNode } from 'react';

import { ArrowRight, Building2, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { LanguageToggle } from '@/components/common/language-toggle';
import {
  canAccessWorkspaceBilling,
  canAccessWorkspaceSettings,
  canAccessWorkspaceTeam,
  canOperateAssessments,
  canViewWorkspaceResults,
} from '@/lib/customer-access';
import { loadCustomerSession } from '@/lib/customer-session';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/language';
import { logoutCustomerSession } from '@/services/customer-api';

const copy = {
  en: {
    brand: 'Vanaila Psikotest',
    workspaceTitle: 'Customer workspace',
    nav: {
      workspace: 'Assessments',
      company: 'Company',
      billing: 'Billing',
      results: 'Results',
      activity: 'Activity',
      team: 'Team',
      createAssessment: 'Create Assessment',
      settings: 'Settings',
      signOut: 'Sign out',
    },
    hero: {
      badge: 'Guided onboarding',
      title: 'Prepare assessment drafts, setup your company profile, then share when the flow is ready.',
      description:
        'Workspace onboarding now covers company defaults, assessment setup, dummy checkout, and participant invitations before external rollout.',
      currentAccess: 'Current workspace mode',
      currentAccessDescription:
        'Workspace access now adapts to the active role, so owners, admins, operators, and reviewers only see the areas they need.',
      createDraft: 'Create a new draft',
      workspaceFallback: 'Workspace',
      role: 'Current role',
    },
  },
  id: {
    brand: 'Vanaila Psikotest',
    workspaceTitle: 'Workspace pelanggan',
    nav: {
      workspace: 'Asesmen',
      company: 'Perusahaan',
      billing: 'Billing',
      results: 'Hasil',
      activity: 'Aktivitas',
      team: 'Tim',
      createAssessment: 'Buat Asesmen',
      settings: 'Pengaturan',
      signOut: 'Keluar',
    },
    hero: {
      badge: 'Onboarding terpandu',
      title: 'Siapkan draft asesmen, atur profil perusahaan, lalu bagikan saat alurnya sudah siap.',
      description:
        'Onboarding workspace kini mencakup profil perusahaan, setup asesmen, checkout dummy, dan undangan peserta sebelum distribusi eksternal.',
      currentAccess: 'Mode workspace saat ini',
      currentAccessDescription:
        'Akses workspace kini menyesuaikan peran aktif, sehingga owner, admin, operator, dan reviewer hanya melihat area yang relevan.',
      createDraft: 'Buat draft baru',
      workspaceFallback: 'Workspace',
      role: 'Peran saat ini',
    },
  },
} as const;

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}

export function CustomerShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const customerSession = loadCustomerSession();
  const { language } = useLanguage();
  const t = copy[language];
  const role = customerSession?.account.workspaceRole ?? 'owner';

  const navItems = [
    { to: '/workspace', label: t.nav.workspace, visible: true },
    { to: '/workspace/company', label: t.nav.company, visible: canAccessWorkspaceSettings(role) },
    { to: '/workspace/billing', label: t.nav.billing, visible: canAccessWorkspaceBilling(role) },
    { to: '/workspace/results', label: t.nav.results, visible: canViewWorkspaceResults(role) },
    { to: '/workspace/activity', label: t.nav.activity, visible: true },
    { to: '/workspace/team', label: t.nav.team, visible: canAccessWorkspaceTeam(role) },
    { to: '/workspace/create', label: t.nav.createAssessment, visible: canOperateAssessments(role) },
    { to: '/workspace/settings', label: t.nav.settings, visible: canAccessWorkspaceSettings(role) },
  ].filter((item) => item.visible);

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
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.hero.role}: {formatRole(role)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {canOperateAssessments(role) ? (
                <Link to="/workspace/create" className="inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                  {t.hero.createDraft} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {canAccessWorkspaceSettings(role) ? (
                <Link to="/workspace/company" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
                  <Building2 className="h-4 w-4" />
                  {t.nav.company}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

