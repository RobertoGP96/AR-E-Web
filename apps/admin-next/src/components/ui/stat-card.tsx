import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const TONES = {
  default: 'text-foreground bg-default',
  accent: 'text-accent bg-accent-soft',
  success: 'text-success-soft-foreground bg-success-soft',
  warning: 'text-warning-soft-foreground bg-warning-soft',
  danger: 'text-danger-soft-foreground bg-danger-soft',
} as const;

export type StatTone = keyof typeof TONES;

/**
 * Metric card: icon box + label + value, soft hover lift. Used by the
 * dashboard groups and the per-page stat strips.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'accent',
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div
      className={`surface-card group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className ?? ''}`}
    >
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-40 transition-transform duration-300 group-hover:scale-125 ${TONES[tone]}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
