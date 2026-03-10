import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/cn';
export function Badge({ className, ...props }) {
    return (_jsx("span", { className: cn('inline-flex items-center rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur', className), ...props }));
}
