import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/cn';
export function Card({ className, ...props }) {
    return (_jsx("div", { className: cn('rounded-2xl border border-border bg-card/90 shadow-panel backdrop-blur', className), ...props }));
}
export function CardHeader({ className, ...props }) {
    return _jsx("div", { className: cn('space-y-1 p-6', className), ...props });
}
export function CardTitle({ className, ...props }) {
    return _jsx("h3", { className: cn('text-lg font-semibold tracking-tight', className), ...props });
}
export function CardDescription({ className, ...props }) {
    return _jsx("p", { className: cn('text-sm text-slate-500', className), ...props });
}
export function CardContent({ className, ...props }) {
    return _jsx("div", { className: cn('p-6 pt-0', className), ...props });
}
