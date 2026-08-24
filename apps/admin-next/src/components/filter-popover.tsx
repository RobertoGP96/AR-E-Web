'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button, Popover } from '@heroui/react';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * "Filtrar" button + HeroUI popover with active-filter chips. Fields
 * apply on change; "Limpiar" resets everything. Same public API as the
 * pre-redesign version.
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

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" aria-label="Abrir filtros">
        <Filter className="h-4 w-4" aria-hidden />
        Filtrar
        {activeFilters.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-accent-foreground">
            {activeFilters.length}
          </span>
        ) : null}
      </Button>

      <Popover.Content
        placement="bottom end"
        className="w-[min(420px,calc(100vw-2rem))]"
      >
        <Popover.Dialog className="p-4">
          <Popover.Heading className="text-sm font-semibold text-foreground">
            {title}
          </Popover.Heading>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>

          <div className="mt-3 space-y-3">{children}</div>

          {activeFilters.length > 0 ? (
            <div className="mt-4 border-t border-separator pt-3">
              <p className="mb-1.5 text-xs font-medium text-muted">
                Filtros activos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-foreground"
                  >
                    {f.label}
                    <button
                      type="button"
                      onClick={f.onRemove}
                      aria-label={`Quitar filtro ${f.label}`}
                      className="rounded-full p-0.5 transition-colors hover:bg-accent/20"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-between gap-2 border-t border-separator pt-3">
            <Button
              variant="ghost"
              size="sm"
              onPress={onClear}
              isDisabled={activeFilters.length === 0}
            >
              Limpiar
            </Button>
            <Button variant="primary" size="sm" onPress={() => setOpen(false)}>
              Aplicar
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
