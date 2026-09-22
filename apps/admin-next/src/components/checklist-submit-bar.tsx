'use client';

import type { ReactNode } from 'react';
import { Button, Spinner } from '@heroui/react';
import type { LucideIcon } from 'lucide-react';

/**
 * Barra de lote pegajosa que acompaña a un ProductChecklist: resumen de
 * lo marcado + botón primario. Es `sticky` (no `fixed`) para viajar
 * dentro del snapshot de la página en las view transitions; en móvil
 * queda por encima del BottomNav flotante (≈ 4.5 rem + separación).
 */
export function ChecklistSubmitBar({
  title,
  summary,
  hints,
  label,
  icon: Icon,
  isPending,
  disabled,
  onSubmit,
  secondary,
}: {
  title: string;
  summary: ReactNode;
  hints?: ReactNode;
  label: string;
  icon?: LucideIcon;
  isPending: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  secondary?: ReactNode;
}) {
  return (
    <div className="sticky bottom-2 z-30 max-md:bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
      <div className="rounded-2xl border border-accent/30 bg-surface/95 p-3 shadow-xl backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {title}
            </p>
            <p className="text-sm font-bold text-foreground">{summary}</p>
          </div>
          {secondary}
          <Button
            variant="primary"
            onPress={onSubmit}
            isDisabled={disabled || isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <Spinner size="sm" color="current" aria-hidden />
            ) : Icon ? (
              <Icon className="h-4 w-4" aria-hidden />
            ) : null}
            {label}
          </Button>
        </div>
        {hints ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-[11px] text-muted">
            {hints}
          </div>
        ) : null}
      </div>
    </div>
  );
}
