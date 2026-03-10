import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/cn';
export const Input = React.forwardRef(({ className, ...props }, ref) => (_jsx("input", { ref: ref, className: cn('flex h-11 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200', className), ...props })));
Input.displayName = 'Input';
