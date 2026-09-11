'use client';

import Link from 'next/link';
import { canAccessPath } from '@/lib/route-roles';
import {
  NAV_GROUPS,
  SIDEBAR_FOOTER,
  isSectionActive,
  type NavSection,
} from '@/lib/navigation';
import { useOptimisticPathname } from './use-optimistic-pathname';

/**
 * Sidebar (escritorio) y contenido del drawer (móvil). La sección
 * pulsada se marca activa al instante (useOptimisticPathname) y el
 * contenido lo cubre el esqueleto de la ruta destino — sin spinners
 * en el menú.
 */
export function AdminNav({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const [pathname, markPending] = useOptimisticPathname();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessPath(role, item.href)),
  })).filter((group) => group.items.length > 0);

  const footerItems = SIDEBAR_FOOTER.filter((item) =>
    canAccessPath(role, item.href)
  );

  function renderItem(item: NavSection) {
    const Icon = item.icon;
    const active = isSectionActive(pathname, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={(event) => {
            markPending(item.href, event);
            onNavigate?.();
          }}
          aria-current={active ? 'page' : undefined}
          className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
            active
              ? 'bg-sidebar-accent font-medium text-white shadow-sm'
              : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-white'
          }`}
        >
          {/* Animated active indicator */}
          <span
            aria-hidden
            className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200 ${
              active ? 'opacity-90' : 'scale-y-0 opacity-0'
            }`}
          />
          <Icon
            className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 ${
              active ? '' : 'group-hover:scale-110'
            }`}
            aria-hidden
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {groups.map((group) => (
        <div key={group.title} className="mb-1.5">
          <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-accent/90">
            {group.title}
          </div>
          <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
        </div>
      ))}
      <div className="mt-auto border-t border-sidebar-border pt-2">
        <ul className="space-y-0.5">{footerItems.map(renderItem)}</ul>
      </div>
    </nav>
  );
}
