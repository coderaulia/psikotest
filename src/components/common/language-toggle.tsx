import { useLanguage } from '@/lib/language';
import { cn } from '@/lib/cn';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn('inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm', className)}>
      {(['en', 'id'] as const).map((option) => {
        const isActive = language === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition',
              isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-950',
            )}
            aria-pressed={isActive}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
