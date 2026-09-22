'use client';

import { useState } from 'react';
import { Check, PackageCheck, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui';
import { removeReceivedProductAction } from './actions';
import type { PackageReception } from './types';

/** «Marcado en este paquete»: recepciones registradas, con deshacer. */
export function ReceivedList({
  packageId,
  receptions,
  canWrite,
}: {
  packageId: string;
  receptions: PackageReception[];
  canWrite: boolean;
}) {
  const [removeTarget, setRemoveTarget] = useState<PackageReception | null>(null);

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <PackageCheck className="h-4 w-4 text-accent" aria-hidden />
        Marcado en este paquete
        {receptions.length > 0 ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-accent">
            {receptions.reduce((s, r) => s + r.amount, 0)} u.
          </span>
        ) : null}
      </h3>
      {receptions.length === 0 ? (
        <p className="surface-card p-4 text-sm text-muted">
          Aún no has marcado llegadas en este paquete.
        </p>
      ) : (
        <ul className="stagger-children space-y-2">
          {receptions.map((rp) => (
            <li key={rp.id} className="surface-card flex flex-wrap items-center gap-3 p-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success-soft-foreground"
              >
                <Check className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {rp.productName}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {rp.clientName}
                  {rp.categoryName ? ` · ${rp.categoryName}` : ''}
                  {rp.observation ? (
                    <span className="italic"> · {rp.observation}</span>
                  ) : null}
                </p>
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">
                ×{rp.amount}
              </span>
              {canWrite ? (
                <button
                  type="button"
                  aria-label={`Eliminar recepción de ${rp.productName}`}
                  onClick={() => setRemoveTarget(rp)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-danger hover:text-danger sm:h-7 sm:w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Eliminar recepción?"
        description={
          removeTarget ? (
            <>
              Se eliminará la recepción de{' '}
              <strong className="text-foreground">
                {removeTarget.amount} unidad{removeTarget.amount === 1 ? '' : 'es'}
              </strong>{' '}
              de <strong className="text-foreground">{removeTarget.productName}</strong>{' '}
              ({removeTarget.clientName}). Sus unidades saldrán de la bolsa
              abierta del cliente y el estado del producto se recalculará.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (!removeTarget) return { ok: false, error: 'Recepción no encontrada' };
          const result = await removeReceivedProductAction(packageId, removeTarget.id);
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Recepción eliminada', {
              description: 'El producto volvió a la lista de pendientes por llegar.',
            });
          }
          return result;
        }}
      />
    </div>
  );
}
