import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StateCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
}

export function StateCard({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  tone = 'default',
}: StateCardProps) {
  return (
    <Card className={tone === 'danger' ? 'border-rose-200 bg-rose-50/80' : 'bg-white/80'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {icon ?? <RefreshCw className="h-4 w-4 text-slate-400" />}
          {title}
        </CardTitle>
        <CardDescription className={tone === 'danger' ? 'text-rose-600' : undefined}>{description}</CardDescription>
      </CardHeader>
      {actionLabel && onAction ? (
        <CardContent>
          <Button variant={tone === 'danger' ? 'outline' : 'secondary'} onClick={onAction}>
            {actionLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
