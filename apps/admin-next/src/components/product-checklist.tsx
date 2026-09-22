'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ExternalLink,
  Minus,
  Plus,
  Search,
} from 'lucide-react';
import { Button, Checkbox } from '@heroui/react';
import { TextInput } from '@/components/ui';
import {
  filterGroups,
  groupState,
  setGroup,
  setItemQty,
  summarize,
  toggleItem,
  type ChecklistGroup,
  type ChecklistItem,
  type ChecklistSelection,
} from '@/lib/product-checklist';

/**
 * Checklist de productos del design system: grupos (cliente, categoría…)
 * con filas marcables y cantidad, buscador, «marcar todo» por grupo y
 * aviso de marcas ocultas por el filtro. Controlado: la selección vive
 * en el llamador (`value`/`onChange`) y los helpers puros de
 * `@/lib/product-checklist` hacen la lógica. No sabe de costos ni de
 * actions: lo específico de cada flujo entra por los slots
 * `renderItemExtra` / `renderGroupExtra` / `itemAction`.
 *
 * Móvil: cada fila es una tarjeta apilada, el stepper tiene objetivos
 * táctiles de 40 px y no hay tablas → sin scroll horizontal.
 */
export interface ProductChecklistProps {
  groups: ChecklistGroup[];
  value: ChecklistSelection;
  onChange: (next: ChecklistSelection) => void;
  readOnly?: boolean;
  emptyMessage: string;
  searchPlaceholder?: string;
  /** Filas renderizadas como máximo (el buscador acota el resto). */
  maxVisible?: number;
  /** Controles extra junto al buscador (filtros del flujo). */
  toolbar?: ReactNode;
  /** Contenido extra por fila (estimado, nota…). */
  renderItemExtra?: (item: ChecklistItem, qty: number) => ReactNode;
  /** Contenido extra en la cabecera del grupo (subtotal…). */
  renderGroupExtra?: (
    group: ChecklistGroup,
    selected: { items: number; units: number }
  ) => ReactNode;
  /** Acción por fila (p. ej. asignar categoría a una fila bloqueada). */
  itemAction?: (item: ChecklistItem) => ReactNode;
  className?: string;
}

const STEP_BTN =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:w-8';

export function ProductChecklist({
  groups,
  value,
  onChange,
  readOnly = false,
  emptyMessage,
  searchPlaceholder = 'Buscar producto o cliente…',
  maxVisible = 120,
  toolbar,
  renderItemExtra,
  renderGroupExtra,
  itemAction,
  className,
}: ProductChecklistProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => filterGroups(groups, query), [groups, query]);
  const summary = useMemo(() => summarize(groups, value), [groups, value]);

  // Recorte de filas renderizadas: se reparte por grupos en orden.
  const { visibleGroups, totalFiltered, shown } = useMemo(() => {
    let budget = maxVisible;
    let total = 0;
    const out: ChecklistGroup[] = [];
    for (const group of filtered) {
      total += group.items.length;
      if (budget <= 0) continue;
      const items = group.items.slice(0, budget);
      budget -= items.length;
      out.push({ ...group, items });
    }
    return {
      visibleGroups: out,
      totalFiltered: total,
      shown: maxVisible - Math.max(0, budget),
    };
  }, [filtered, maxVisible]);

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of visibleGroups) for (const i of g.items) ids.add(i.id);
    return ids;
  }, [visibleGroups]);
  const hiddenMarked = Object.keys(value).filter(
    (id) => value[id] > 0 && !visibleIds.has(id)
  ).length;

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  if (totalItems === 0) {
    return (
      <p className={`surface-card p-4 text-sm text-muted ${className ?? ''}`}>
        {emptyMessage}
      </p>
    );
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  function renderItem(item: ChecklistItem) {
    const qty = value[item.id] ?? 0;
    const picked = qty > 0;
    const markable = !readOnly && item.max > 0 && !item.disabledReason;
    return (
      <li key={item.id}>
        <div
          onClick={markable ? () => onChange(toggleItem(value, item)) : undefined}
          className={`flex flex-wrap items-center gap-3 px-3 py-2.5 transition-colors ${
            markable ? 'cursor-pointer' : ''
          } ${picked ? 'bg-accent-soft/40' : markable ? 'hover:bg-default/60' : ''}`}
        >
          {markable ? (
            <Checkbox
              isSelected={picked}
              onChange={() => onChange(toggleItem(value, item))}
              aria-label={`Marcar ${item.name}`}
              className="shrink-0"
            >
              <Checkbox.Content onClick={stop}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Content>
            </Checkbox>
          ) : (
            <span className="h-5 w-5 shrink-0" aria-hidden />
          )}

          <div className="min-w-0 flex-1 basis-48">
            <p className="line-clamp-2 break-words text-sm font-semibold text-foreground">
              {item.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              {item.subtitle ? <span>{item.subtitle}</span> : null}
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={stop}
                  className="inline-flex items-center gap-0.5 transition-colors hover:text-accent"
                >
                  Ver orden
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
              {item.meta ? <span className="tabular-nums">{item.meta}</span> : null}
            </p>
            {item.disabledReason ? (
              <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning-soft-foreground">
                {item.disabledReason}
              </p>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2" onClick={stop}>
            {itemAction ? itemAction(item) : null}
            {picked && !readOnly ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Restar una unidad"
                  onClick={() => onChange(setItemQty(value, item, qty - 1))}
                  disabled={qty <= 1}
                  className={STEP_BTN}
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={item.max}
                  value={qty}
                  aria-label={`Unidades de ${item.name}`}
                  onChange={(e) =>
                    onChange(setItemQty(value, item, Number(e.target.value)))
                  }
                  className="h-10 w-14 rounded-lg border border-border bg-surface text-center text-sm tabular-nums text-foreground focus:border-accent focus:outline-none sm:h-8 sm:w-12"
                />
                <button
                  type="button"
                  aria-label="Sumar una unidad"
                  onClick={() => onChange(setItemQty(value, item, qty + 1))}
                  disabled={qty >= item.max}
                  className={STEP_BTN}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="pl-1 text-xs tabular-nums text-muted">
                  / {item.max}
                </span>
              </div>
            ) : item.max > 0 && !item.disabledReason ? (
              <span className="rounded-full bg-default px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
                {item.max}
              </span>
            ) : null}
          </div>

          {renderItemExtra && picked ? (
            <div className="basis-full pl-8" onClick={stop}>
              {renderItemExtra(item, qty)}
            </div>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {toolbar}
        {!readOnly && summary.items > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => onChange({})}
            className="self-end"
          >
            Quitar marcas ({summary.items})
          </Button>
        ) : null}
      </div>

      {visibleGroups.length === 0 ? (
        <p className="surface-card p-4 text-sm text-muted">
          Sin productos para «{query.trim()}».
        </p>
      ) : (
        <div className="stagger-children space-y-3">
          {visibleGroups.map((group) => {
            const state = groupState(group, value);
            const isCollapsed = !query && (collapsed[group.id] ?? false);
            const selected = summary.perGroup[group.id] ?? { items: 0, units: 0 };
            const hasMarkable = group.items.some(
              (i) => i.max > 0 && !i.disabledReason
            );
            return (
              <section key={group.id} className="surface-card overflow-hidden">
                <header className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5">
                  {!readOnly && hasMarkable ? (
                    <Checkbox
                      isSelected={state === 'all'}
                      isIndeterminate={state === 'some'}
                      onChange={(checked) =>
                        onChange(
                          setGroup(value, group, checked ? 'all' : 'none')
                        )
                      }
                      aria-label={`Marcar todo de ${group.label}`}
                      className="shrink-0"
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [group.id]: !(prev[group.id] ?? false),
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {group.label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {group.items.length} producto
                        {group.items.length === 1 ? '' : 's'}
                        {group.hint ? ` · ${group.hint}` : ''}
                        {selected.units > 0
                          ? ` · ${selected.units} marcada${
                              selected.units === 1 ? '' : 's'
                            }`
                          : ''}
                      </span>
                    </span>
                    <ChevronDown
                      className={`ml-auto h-4 w-4 shrink-0 text-muted transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {renderGroupExtra ? (
                    <div className="basis-full sm:basis-auto">
                      {renderGroupExtra(group, selected)}
                    </div>
                  ) : null}
                </header>
                {isCollapsed ? null : (
                  <ul className="divide-y divide-border">
                    {group.items.map(renderItem)}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {totalFiltered > shown ? (
        <p className="text-center text-xs text-muted">
          Mostrando {shown} de {totalFiltered} productos — usa el buscador para
          acotar.
        </p>
      ) : null}
      {hiddenMarked > 0 ? (
        <p className="text-center text-xs font-medium text-warning-soft-foreground">
          {hiddenMarked} producto{hiddenMarked === 1 ? '' : 's'} marcado
          {hiddenMarked === 1 ? '' : 's'} no se ve{hiddenMarked === 1 ? '' : 'n'}{' '}
          con el filtro actual.
        </p>
      ) : null}
    </div>
  );
}
