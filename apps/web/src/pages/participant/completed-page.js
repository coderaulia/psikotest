import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export function ParticipantCompletedPage() {
    return (_jsxs(Card, { className: "mx-auto w-full max-w-3xl bg-white/82 text-center", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Assessment completed" }), _jsx(CardDescription, { children: "Your responses have been submitted successfully." })] }), _jsxs(CardContent, { className: "space-y-5", children: [_jsx("div", { className: "rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm leading-7 text-slate-500", children: "Thank you for completing the assessment. The administrator can now review your responses and results inside the reporting dashboard." }), _jsx(Button, { variant: "secondary", asChild: true, children: _jsx(Link, { to: "/", children: "Return to home" }) })] })] }));
}
