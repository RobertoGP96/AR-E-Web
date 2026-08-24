import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Standard page heading: brand icon chip + title + subtitle, with an
 * actions slot that wraps below on small screens.
 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-sm">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
