import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileStack, LayoutGrid, LineChart, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/admin/participants', label: 'Participants', icon: Users },
    { to: '/admin/test-sessions', label: 'Test Sessions', icon: FileStack },
    { to: '/admin/results', label: 'Results', icon: LineChart },
    { to: '/admin/reports', label: 'Reports', icon: Settings },
];
export function AdminShell({ children }) {
    return (_jsx("div", { className: "min-h-screen bg-[linear-gradient(180deg,#fbfbfc_0%,#f3f4f6_45%,#eef1f5_100%)] text-slate-950", children: _jsxs("div", { className: "mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:px-6", children: [_jsxs("aside", { className: "hidden w-72 shrink-0 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-panel backdrop-blur lg:flex lg:flex-col", children: [_jsxs("div", { className: "space-y-2 border-b border-slate-200 pb-5", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.24em] text-slate-400", children: "Psikotest" }), _jsx("h1", { className: "text-2xl font-semibold", children: "Assessment Console" }), _jsx("p", { className: "text-sm text-slate-500", children: "Calm reporting and participant operations." })] }), _jsx("nav", { className: "mt-6 space-y-2", children: navItems.map((item) => {
                                const Icon = item.icon;
                                return (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-950/5 hover:text-slate-950', isActive && 'bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white'), children: [_jsx(Icon, { className: "h-4 w-4" }), item.label] }, item.to));
                            }) })] }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col rounded-[28px] border border-white/70 bg-white/70 shadow-panel backdrop-blur", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-slate-200 px-6 py-5", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.2em] text-slate-400", children: "Admin Workspace" }), _jsx("p", { className: "mt-1 text-lg font-semibold", children: "Psychological Assessment Platform" })] }), _jsx("div", { className: "hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-500 md:block", children: "admin@psikotest.local" })] }), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: children })] })] }) }));
}
