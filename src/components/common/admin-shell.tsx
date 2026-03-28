import type { ReactNode } from 'react';

import { ClipboardList, FileCog, FileStack, LayoutGrid, LineChart, LogOut, Settings, Users, Building2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { LanguageToggle } from '@/components/common/language-toggle';
import { loadAdminSession } from '@/lib/admin-session';
import { cn } from '@/lib/cn';
import { formatTokenLabel } from '@/lib/formatters';
import { useLanguage } from '@/lib/language';
import { logoutAdminSession } from '@/services/admin-api';

const copy = {
  en: {
    eyebrow: 'Psikotest',
    title: 'Assessment Console',
    description: 'Calm reporting and participant operations.',
    workspaceEyebrow: 'Admin Workspace',
    workspaceTitle: 'Psychological Assessment Platform',
    protectedWorkspace: 'Protected workspace',
    signOut: 'Sign out',
    nav: {
      dashboard: 'Dashboard',
      participants: 'Participants',
      testSessions: 'Test Sessions',
      questionBank: 'Question Bank',
      results: 'Results',
      reports: 'Reports',
      settings: 'Settings',
      reviewerQueue: 'Reviewer Queue',
      customers: 'Customers',
    },
  },
  id: {
    eyebrow: 'Psikotest',
    title: 'Konsol Asesmen',
    description: 'Pelaporan yang tenang dan operasi peserta.',
    workspaceEyebrow: 'Workspace Admin',
    workspaceTitle: 'Platform Asesmen Psikologis',
    protectedWorkspace: 'Workspace terlindungi',
    signOut: 'Keluar',
    nav: {
      dashboard: 'Dashboard',
      participants: 'Peserta',
      testSessions: 'Sesi Tes',
      questionBank: 'Bank Soal',
      results: 'Hasil',
      reports: 'Laporan',
      settings: 'Pengaturan',
      reviewerQueue: 'Antrian Reviewer',
      customers: 'Pelanggan',
    },
  },
} as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const adminSession = loadAdminSession();
  const { language } = useLanguage();
  const t = copy[language];
  const isSuperAdmin = adminSession?.admin.role === 'super_admin';
  const canReview = ['super_admin', 'psychologist_reviewer'].includes(adminSession?.admin.role ?? '');
  const baseNavItems = [
    { to: '/admin/dashboard', label: t.nav.dashboard, icon: LayoutGrid },
    { to: '/admin/participants', label: t.nav.participants, icon: Users },
    { to: '/admin/test-sessions', label: t.nav.testSessions, icon: FileStack },
    { to: '/admin/question-bank', label: t.nav.questionBank, icon: FileCog },
    { to: '/admin/results', label: t.nav.results, icon: LineChart },
    { to: '/admin/reports', label: t.nav.reports, icon: LineChart },
    ...(isSuperAdmin ? [{ to: '/admin/customers', label: t.nav.customers, icon: Building2 }] : []),
    { to: '/admin/settings', label: t.nav.settings, icon: Settings },
  ];
  const reviewerNavItem = { to: '/admin/reviewer-queue', label: t.nav.reviewerQueue, icon: ClipboardList };
  const navItems = canReview
    ? [...baseNavItems.slice(0, 5), reviewerNavItem, ...baseNavItems.slice(5)]
    : baseNavItems;

  async function handleLogout() {
    await logoutAdminSession();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfbfc_0%,#f3f4f6_45%,#eef1f5_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-panel backdrop-blur lg:flex lg:flex-col">
          <div className="space-y-2 border-b border-slate-200 pb-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">{t.eyebrow}</p>
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <p className="text-sm text-slate-500">{t.description}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-950/5 hover:text-slate-950',
                      isActive && 'bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-white/70 bg-white/70 shadow-panel backdrop-blur">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t.workspaceEyebrow}</p>
              <p className="mt-1 text-lg font-semibold">{t.workspaceTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle className="hidden md:inline-flex" />
              <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-500 md:block">
                {adminSession?.admin.email ?? t.protectedWorkspace}
              </div>
              {adminSession ? (
                <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-500 lg:block">
                  {formatTokenLabel(adminSession.admin.role)}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 flex justify-end md:hidden">
              <LanguageToggle />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
