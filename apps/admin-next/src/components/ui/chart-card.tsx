import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@heroui/react';

/**
 * Contenedor estándar de gráficos y paneles analíticos (HeroUI Card +
 * identidad surface-card): cabecera con icono/título/subtítulo y una
 * ranura de acción a la derecha (toggles, filtros locales).
 */
export function ChartCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={`surface-card gap-0 overflow-hidden p-0 transition-shadow duration-300 hover:shadow-md ${className ?? ''}`}
    >
      <header className="flex flex-col gap-2 border-b border-separator px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={bodyClassName ?? 'px-4 py-4'}>{children}</div>
    </Card>
  );
}
