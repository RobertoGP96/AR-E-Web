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
import { AppModal } from '@/components/ui';
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

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(0);
  const seqRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl+K / Cmd+K toggles the palette from anywhere in the panel.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, groups]);

  const flat = groups.flatMap((g) => g.items);

  function close() {
    setOpen(false);
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

  return (
    <>
      <Button
        variant="ghost"
        isIconOnly
        aria-label="Búsqueda global (Ctrl+K)"
        className="sm:hidden"
        onPress={() => setOpen(true)}
      >
        <Search className="h-5 w-5" aria-hidden />
      </Button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-44 items-center gap-2 rounded-xl border border-border bg-default/50 px-3 text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground sm:flex lg:w-56"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Buscar…</span>
        <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">
          Ctrl K
        </kbd>
      </button>

      <AppModal
        isOpen={open}
        onClose={close}
        title="Búsqueda global"
        description="Órdenes, productos, clientes, entregas, paquetes y más."
        icon={<Search className="h-5 w-5" aria-hidden />}
        size="lg"
      >
        <div className="space-y-3">
          <SearchField
            value={query}
            onChange={setQuery}
            aria-label="Buscar en todo el panel"
            fullWidth
          >
            <SearchField.Group className="w-full">
              <SearchField.SearchIcon />
              <SearchField.Input
                placeholder="Buscar por nombre, teléfono, tracking, SKU, #ID…"
                autoFocus
                onKeyDown={onInputKeyDown}
              />
              <SearchField.ClearButton aria-label="Limpiar búsqueda" />
            </SearchField.Group>
          </SearchField>

          <div ref={listRef} className="max-h-[50vh] min-h-40 overflow-y-auto">
            {status === 'loading' ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner aria-label="Buscando" />
              </div>
            ) : status === 'done' && flat.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-default text-muted">
                  <SearchX className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm text-muted">
                  Sin resultados para “{query.trim()}”.
                </p>
              </div>
            ) : status === 'idle' ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
                  <Search className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm text-muted">
                  Escribe al menos {MIN_QUERY} caracteres para buscar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group, groupIndex) => {
                  const meta = ENTITY_META[group.entity];
                  return (
                    <section key={group.entity}>
                      <h3 className="flex items-center gap-1.5 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <meta.icon
                          className="h-3.5 w-3.5 text-accent"
                          aria-hidden
                        />
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
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
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
            )}
          </div>

          <p className="hidden items-center justify-end gap-3 border-t border-separator pt-2 text-[11px] text-muted sm:flex">
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
        </div>
      </AppModal>
    </>
  );
}
