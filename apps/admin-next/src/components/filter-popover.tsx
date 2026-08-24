'use client';

import { useEffect, useRef, useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * "Filtrar" button + popover with active-filter badges, ported from
 * the Vite admin's components/filters pattern. Fields apply on change;
 * "Limpiar" resets everything.
 */
export function FilterPopover({
  title,
  subtitle,
  activeFilters,
  onClear,
  children,
}: {
  title: string;
  subtitle: string;
  activeFilters: ActiveFilter[];
  onClear: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" aria-hidden />
        Filtrar
        {activeFilters.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-semibold text-white">
            {activeFilters.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-border bg-white p-4 shadow-xl">
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>

          <div className="mt-3 space-y-3">{children}</div>

          {activeFilters.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                Filtros activos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
                  >
                    {f.label}
                    <button
                      type="button"
                      onClick={f.onRemove}
                      aria-label={`Quitar filtro ${f.label}`}
                      className="rounded-full p-0.5 hover:bg-orange-100"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={onClear}
              disabled={activeFilters.length === 0}
              className="text-xs font-medium text-gray-500 transition hover:text-gray-800 disabled:opacity-40"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-strong"
            >
              Aplicar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
