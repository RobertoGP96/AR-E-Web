'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, SearchField, Spinner } from '@heroui/react';
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  Truck,
  PackageCheck,
  ShoppingBag,
  Store,
  Tags,
  FileText,
  SearchX,
  type LucideIcon,
} from 'lucide-react';
import {
  globalSearchAction,
  type SearchEntity,
  type SearchGroup,
} from './search/actions';

const DEBOUNCE_MS = 250;
const MIN_QUERY = 2;

// Same labels/icons the breadcrumbs and nav use for each route.
const ENTITY_META: Record<SearchEntity, { label: string; icon: LucideIcon }> = {
  orders: { label: 'Órdenes', icon: ShoppingCart },
  products: { label: 'Productos', icon: Package },
  users: { label: 'Usuarios', icon: Users },
  delivery: { label: 'Entregas', icon: Truck },
  packages: { label: 'Paquetes', icon: PackageCheck },
  purchases: { label: 'Compras', icon: ShoppingBag },
  shops: { label: 'Tiendas', icon: Store },
  categories: { label: 'Categorías', icon: Tags },
  expenses: { label: 'Gastos', icon: FileText },
};

type Status = 'idle' | 'loading' | 'done';

/**
 * Global search in the admin header. Desktop shows the search bar
 * inline with a results popover anchored below it; mobile shows an
 * icon that unfolds a full-width bar under the header. Same manual
 * popover pattern as filter-popover.tsx (absolute panel + outside
 * pointerdown to close) — the anchor for the mobile strip is the
 * header itself, which is `relative` in (admin)/layout.tsx.
 */
export function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(0);

  // Ctrl+K / Cmd+K focuses the bar (or unfolds it on mobile).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.matchMedia('(min-width: 640px)').matches) {
          setOpen(true);
          rootRef.current
            ?.querySelector<HTMLInputElement>('input')
            ?.focus();
        } else {
          setMobileOpen(true);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close both panels on any pointerdown outside the component.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Debounced search; seqRef discards responses that arrive out of order.
  useEffect(() => {
    const trimmed = query.trim();
    const seq = ++seqRef.current;
    const timer = setTimeout(
      async () => {
        if (trimmed.length < MIN_QUERY) {
          setStatus('idle');
          setGroups([]);
          setActive(0);
          return;
        }
        setStatus('loading');
        const result = await globalSearchAction(trimmed);
        if (seqRef.current !== seq) return;
        setStatus('done');
        setGroups('error' in result ? [] : result.groups);
        setActive(0);
      },
      trimmed.length < MIN_QUERY ? 0 : DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    rootRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, groups]);

  const flat = groups.flatMap((g) => g.items);
  const trimmed = query.trim();

  function close() {
    setOpen(false);
    setMobileOpen(false);
    setQuery('');
    setStatus('idle');
    setGroups([]);
    setActive(0);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape' && query === '') {
      setOpen(false);
      setMobileOpen(false);
      (event.target as HTMLElement).blur();
      return;
    }
    if (flat.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = flat[active];
      if (item) go(item.href);
    }
  }

  // Flat-index offset of each group so arrow keys walk the whole list.
  const offsets = groups.map((_, i) =>
    groups.slice(0, i).reduce((sum, g) => sum + g.items.length, 0)
  );

  const searchField = (autoFocus: boolean) => (
    <SearchField
      value={query}
      onChange={(value) => {
        setQuery(value);
        setOpen(true);
      }}
      aria-label="Buscar en todo el panel"
      fullWidth
    >
      <SearchField.Group className="w-full">
        <SearchField.SearchIcon />
        <SearchField.Input
          placeholder="Buscar…"
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
        />
        <SearchField.ClearButton aria-label="Limpiar búsqueda" />
        {!query ? (
          <kbd className="mr-1 hidden shrink-0 rounded-md border border-border bg-default px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted sm:block">
            Ctrl K
          </kbd>
        ) : null}
      </SearchField.Group>
    </SearchField>
  );

  const results = (
    <>
      <div
        className={`max-h-[min(22rem,55vh)] overflow-y-auto p-1.5 transition-opacity ${
          status === 'loading' && flat.length > 0 ? 'opacity-60' : ''
        }`}
      >
        {trimmed.length < MIN_QUERY ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            Escribe al menos {MIN_QUERY} caracteres para buscar.
          </p>
        ) : flat.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group, groupIndex) => {
              const meta = ENTITY_META[group.entity];
              return (
                <section key={group.entity}>
                  <h3 className="flex items-center gap-1.5 px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <meta.icon className="h-3.5 w-3.5 text-accent" aria-hidden />
                    {meta.label}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.items.map((item, itemIndex) => {
                      const index = offsets[groupIndex] + itemIndex;
                      const isActive = index === active;
                      return (
                        <li key={`${group.entity}-${item.id}`}>
                          <Link
                            href={item.href}
                            data-active={isActive ? 'true' : undefined}
                            onClick={close}
                            onMouseEnter={() => setActive(index)}
                            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                              isActive
                                ? 'bg-accent-soft text-accent-soft-foreground'
                                : 'hover:bg-surface-hover'
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isActive
                                  ? 'bg-background/60 text-accent'
                                  : 'bg-default text-muted'
                              }`}
                            >
                              <meta.icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="block truncate text-xs text-muted">
                                  {item.subtitle}
                                </span>
                              ) : null}
                            </span>
                            {item.badge ? (
                              <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium capitalize text-muted">
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : status === 'done' ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-default text-muted">
              <SearchX className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm text-muted">
              Sin resultados para “{trimmed}”.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center px-3 py-8">
            <Spinner aria-label="Buscando" />
          </div>
        )}
      </div>
      <p className="hidden items-center justify-end gap-3 border-t border-separator px-3 py-1.5 text-[11px] text-muted sm:flex">
        <span>
          <kbd className="rounded border border-border bg-default px-1 font-sans">
            ↑↓
          </kbd>{' '}
          navegar
        </span>
        <span>
          <kbd className="rounded border border-border bg-default px-1 font-sans">
            Enter
          </kbd>{' '}
          abrir
        </span>
        <span>
          <kbd className="rounded border border-border bg-default px-1 font-sans">
            Esc
          </kbd>{' '}
          cerrar
        </span>
      </p>
    </>
  );

  const panelClasses =
    'overflow-hidden rounded-xl border border-border bg-background shadow-xl';

  return (
    <div ref={rootRef} className="flex items-center">
      {/* Mobile: icon button unfolds a bar under the header */}
      <Button
        variant="ghost"
        isIconOnly
        aria-label="Búsqueda global"
        aria-expanded={mobileOpen}
        className="sm:hidden"
        onPress={() => setMobileOpen((o) => !o)}
      >
        <Search className="h-5 w-5" aria-hidden />
      </Button>
      {mobileOpen ? (
        <div
          className={`absolute inset-x-2 top-full z-30 mt-1 p-2 sm:hidden ${panelClasses}`}
        >
          {searchField(true)}
          {trimmed.length > 0 ? <div className="mt-1">{results}</div> : null}
        </div>
      ) : null}

      {/* Desktop: inline bar + results popover anchored below it */}
      <div className="relative hidden w-48 sm:block lg:w-64">
        {searchField(false)}
        {open && trimmed.length > 0 ? (
          <div
            className={`absolute right-0 top-full z-30 mt-2 w-[min(30rem,calc(100vw-2rem))] ${panelClasses}`}
          >
            {results}
          </div>
        ) : null}
      </div>
    </div>
  );
}
