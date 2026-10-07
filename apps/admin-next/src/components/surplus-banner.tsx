'use client';

import { useMemo, useState } from 'react';
import { Split } from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import {
  planSurplusDistribution,
  type PendingTarget,
  type RedistributeResult,
} from '@/lib/surplus';

/**
 * RN-023 — aviso de sobrepago en el detalle de una orden o entrega, con la
 * acción de repartir el exceso entre los pendientes del cliente. Si no hay
 * pendientes solo informa de que el exceso es saldo a favor.
 */
export function SurplusBanner({
  surplus,
  targets,
  canAct,
  onRedistribute,
}: {
  /** Efectivo cobrado por encima del costo (ya acotado al efectivo). */
  surplus: number;
  /** Pendientes del cliente sin esta partida, en orden canónico. */
  targets: PendingTarget[];
  canAct: boolean;
  onRedistribute: () => Promise<RedistributeResult>;
}) {
  const [open, setOpen] = useState(false);
  const plan = useMemo(
    () => planSurplusDistribution(surplus, targets),
    [surplus, targets]
  );
  if (surplus <= 0) return null;
  const canDistribute = canAct && plan.allocations.length > 0;

  return (
    <div
      className="mt-4 flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning-soft/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      data-testid="surplus-banner"
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          Sobrepago de {formatCurrency(surplus)}
        </p>
        <p className="text-xs text-muted">
          {targets.length > 0
            ? `El cliente tiene ${targets.length} partida${targets.length === 1 ? '' : 's'} por pagar; el exceso puede cubrirla${targets.length === 1 ? '' : 's'} de la más antigua a la más reciente.`
            : 'El cliente no tiene otras partidas pendientes: el exceso queda como saldo a favor (RN-021).'}
        </p>
      </div>
      {canDistribute ? (
        <Button variant="secondary" onPress={() => setOpen(true)} className="shrink-0">
          <Split className="h-4 w-4" aria-hidden />
          Repartir entre pendientes
        </Button>
      ) : null}

      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="¿Repartir el sobrepago?"
        tone="accent"
        confirmLabel="Repartir"
        description={
          <div className="space-y-2">
            <p>
              Se moverán <strong className="text-foreground">{formatCurrency(surplus - plan.remaining)}</strong>{' '}
              de efectivo de esta partida a:
            </p>
            <ul className="space-y-1 text-xs">
              {plan.allocations.map((a) => {
                const t = targets.find((x) => x.kind === a.kind && x.id === a.id);
                return (
                  <li
                    key={`${a.kind}-${a.id}`}
                    className="flex items-center justify-between rounded-md bg-background px-2 py-1"
                  >
                    <span className="text-foreground">
                      {t?.label ?? (a.kind === 'order' ? `Pedido #${a.id}` : `Entrega #${a.id}`)}
                      {t && a.amount < t.pending ? (
                        <span className="text-muted"> (quedará Parcial)</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums font-medium">{formatCurrency(a.amount)}</span>
                  </li>
                );
              })}
              {plan.remaining > 0 ? (
                <li className="flex items-center justify-between px-2 py-1 text-muted">
                  <span>Resto a saldo a favor</span>
                  <span className="tabular-nums">{formatCurrency(plan.remaining)}</span>
                </li>
              ) : null}
            </ul>
            <p className="text-xs text-muted">
              El balance del cliente no cambia: solo se mueve efectivo entre partidas.
            </p>
          </div>
        }
        onConfirm={async () => {
          const result = await onRedistribute();
          if (result.ok) {
            setOpen(false);
            toast.success('Sobrepago repartido', {
              description: `${formatCurrency(result.redistributed.moved)} cubrieron ${result.redistributed.count} partida${result.redistributed.count === 1 ? '' : 's'}.`,
            });
          }
          return result;
        }}
      />
    </div>
  );
}
