import { cn } from '@/lib/cn';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-slate-200/70', className)}>
      <div
        className="h-full rounded-full bg-slate-900 transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
