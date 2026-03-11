import * as React from 'react';

import { cn } from '@/lib/cn';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200',
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = 'Select';
