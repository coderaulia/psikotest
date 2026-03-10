import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/cn';
export function Progress({ value, className }) {
    return (_jsx("div", { className: cn('h-2 overflow-hidden rounded-full bg-slate-200/70', className), children: _jsx("div", { className: "h-full rounded-full bg-slate-900 transition-all duration-300", style: { width: `${Math.max(0, Math.min(100, value))}%` } }) }));
}
