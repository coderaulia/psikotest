import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, actions }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {actions}
    </div>
  );
}
