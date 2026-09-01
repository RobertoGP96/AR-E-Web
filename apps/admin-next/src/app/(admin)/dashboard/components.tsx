import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { canAccessPath } from '@/lib/route-roles';

// Piezas compartidas por los dashboards de rol. Todo son server
// components: la única interactividad son links hacia las páginas de
// trabajo, así cada rol aterriza con un clic donde opera.

export function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function DashboardHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-accent pl-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
        {label}
      </h3>
    </div>
  );
}

export interface QuickAction {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Atajos del rol: tarjetas-link hacia las páginas donde ese rol
 * trabaja a diario. El RBAC de rutas filtra por si un atajo se
 * reutiliza en un rol sin acceso (query strings aparte).
 */
export function QuickActions({
  role,
  actions,
}: {
  role: string;
  actions: readonly QuickAction[];
}) {
  const visible = actions.filter((action) =>
    canAccessPath(role, action.href.split('?')[0])
  );
  if (visible.length === 0) return null;
  return (
    <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="surface-card group flex flex-col gap-2.5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-200 group-hover:scale-110">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-muted opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {action.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Envuelve una StatCard en un link a la vista filtrada que la explica.
 * Si el rol no puede abrir esa ruta, la tarjeta queda sin link.
 */
export function StatLink({
  role,
  href,
  children,
}: {
  role: string;
  href: string;
  children: ReactNode;
}) {
  if (!canAccessPath(role, href.split('?')[0])) return <>{children}</>;
  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
}

/** Tarjeta contenedora de listas operativas (filas divididas). */
export function ListCard({
  icon: Icon,
  title,
  hint,
  viewAll,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  viewAll?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="surface-card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-separator px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h3>
            {hint ? <p className="truncate text-xs text-muted">{hint}</p> : null}
          </div>
        </div>
        {viewAll ? (
          <Link
            href={viewAll.href}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            {viewAll.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </header>
      <div className="flex-1 divide-y divide-separator">{children}</div>
    </section>
  );
}

/** Fila clicable de una ListCard. */
export function RowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent-soft/40"
    >
      {children}
    </Link>
  );
}

/** Fila estática de una ListCard (mismo ritmo visual que RowLink). */
export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      {children}
    </div>
  );
}

export function ListEmpty({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Icon className="h-6 w-6 text-muted/70" aria-hidden />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
