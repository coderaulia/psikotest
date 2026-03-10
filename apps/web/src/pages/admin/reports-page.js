import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from '@/components/common/section-heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
const reportCards = [
    {
        title: 'Average Score by Test Type',
        description: 'Prepared card slot for chart rendering and report export workflows.',
    },
    {
        title: 'DISC Distribution',
        description: 'Reserved panel for dominant profile distribution and radar-ready aggregates.',
    },
    {
        title: 'Workload Distribution',
        description: 'Reserved panel for category-level workload trends and risk clusters.',
    },
];
export function ReportsPage() {
    return (_jsxs("div", { className: "space-y-8", children: [_jsx(SectionHeading, { eyebrow: "Reports", title: "Reporting workspace", description: "Prepared visual slots for score summaries, distributions, and recent participant trends." }), _jsx("div", { className: "grid gap-4 lg:grid-cols-3", children: reportCards.map((card) => (_jsxs(Card, { className: "bg-white/80", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: card.title }), _jsx(CardDescription, { children: card.description })] }), _jsx(CardContent, { children: _jsx("div", { className: "flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400", children: "Chart placeholder" }) })] }, card.title))) })] }));
}
