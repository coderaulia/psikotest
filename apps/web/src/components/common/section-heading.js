import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '@/components/ui/badge';
export function SectionHeading({ eyebrow, title, description, actions }) {
    return (_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { className: "space-y-3", children: [eyebrow ? _jsx(Badge, { children: eyebrow }) : null, _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-semibold tracking-tight text-slate-950", children: title }), description ? _jsx("p", { className: "max-w-2xl text-sm leading-6 text-slate-500", children: description }) : null] })] }), actions] }));
}
