import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function NotFoundPage() {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f7fb_45%,#e9eef5_100%)] px-4", children: _jsxs(Card, { className: "w-full max-w-xl bg-white/82 text-center", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Page not found" }) }), _jsxs(CardContent, { className: "space-y-4 text-sm text-slate-500", children: [_jsx("p", { children: "The requested page does not exist in the current MVP route map." }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/", children: "Go back home" }) })] })] }) }));
}
