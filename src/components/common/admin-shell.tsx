import type { ReactNode } from 'react';

import { ClipboardList, FileCog, FileStack, LayoutGrid, LineChart, LogOut, Settings, Users } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { loadAdminSession } from '@/lib/admin-session';
import { cn } from '@/lib/cn';
import { formatTokenLabel } from '@/lib/formatters';
import { logoutAdminSession } from '@/services/admin-api';

const baseNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/test-sessions', label: 'Test Sessions', icon: FileStack },
  { to: '/admin/question-bank', label: 'Question Bank', icon: FileCog },
  { to: '/admin/results', label: 'Results', icon: LineChart },
  { to: '/admin/reports', label: 'Reports', icon: LineChart },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const reviewerNavItem = { to: '/admin/reviewer-queue', label: 'Reviewer Queue', icon: ClipboardList };

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const adminSession = loadAdminSession();
  const canReview = ['super_admin', 'psychologist_reviewer'].includes(adminSession?.admin.role ?? '');
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
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Psikotest</p>
            <h1 className="text-2xl font-semibold">Assessment Console</h1>
            <p className="text-sm text-slate-500">Calm reporting and participant operations.</p>
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
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Admin Workspace</p>
              <p className="mt-1 text-lg font-semibold">Psychological Assessment Platform</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-500 md:block">
                {adminSession?.admin.email ?? 'Protected workspace'}
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
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
