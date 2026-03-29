import type { WorkspaceUsageSeverity } from '@/types/assessment';

export function getWorkspaceUsageSeverityLabel(severity: WorkspaceUsageSeverity) {
  switch (severity) {
    case 'limit_reached':
      return 'Limit reached';
    case 'critical':
      return 'Upgrade soon';
    case 'warning':
      return 'Watch usage';
    case 'healthy':
    default:
      return 'Healthy';
  }
}

export function getWorkspaceUsageSeverityClasses(severity: WorkspaceUsageSeverity) {
  switch (severity) {
    case 'limit_reached':
      return {
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
        panel: 'border-rose-200 bg-rose-50/80 text-rose-700',
        progress: 'bg-rose-500',
      };
    case 'critical':
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        panel: 'border-amber-200 bg-amber-50/80 text-amber-700',
        progress: 'bg-amber-500',
      };
    case 'warning':
      return {
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
        panel: 'border-sky-200 bg-sky-50/80 text-sky-700',
        progress: 'bg-sky-500',
      };
    case 'healthy':
    default:
      return {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        panel: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
        progress: 'bg-emerald-500',
      };
  }
}
