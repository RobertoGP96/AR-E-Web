'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Scale,
  Send,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui';
import {
  deliveryActionsFor,
  deliveryPhase,
  type DeliveryAction,
} from '@/lib/delivery-status';
import { transitionDeliveryStatusAction } from './actions';
import { DeliverDialog } from './deliver-dialog';
import { WeighDialog } from './weigh-dialog';

const ICONS: Record<DeliveryAction, LucideIcon> = {
  dispatch: Send,
  deliver: CheckCircle2,
  fail: XCircle,
  retry: RotateCcw,
  undispatch: Undo2,
  reopen: RotateCcw,
};

export interface DeliveryActionsTarget {
  id: string;
  clientName: string;
  categoryName: string | null;
  status: string;
  weight: number;
  productCount: number;
  chargePerLb: number;
  agentProfit: number;
  deliverPicture: string | null;
}

/**
 * Acciones explícitas de la entrega según su fase (INV-006): «Pesar y
 * cerrar» para bolsas, y despachar / entregar / fallida / reabrir para
 * entregas pesadas. Sin select libre de estado.
 */
export function DeliveryActionsBar({
  delivery,
  role,
  compact = false,
}: {
  delivery: DeliveryActionsTarget;
  role: string;
  compact?: boolean;
}) {
  const [pending, setPending] = useState<DeliveryAction | null>(null);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [weighOpen, setWeighOpen] = useState<'close' | 'correct' | null>(null);

  const phase = deliveryPhase(delivery);
  const actions = deliveryActionsFor(delivery, role).filter(
    (a) => !compact || ['dispatch', 'deliver', 'retry'].includes(a.action)
  );
  const canWeigh = ['admin', 'logistical'].includes(role);
  const size = compact ? 'sm' : 'md';
  const btnClass = compact ? '' : 'h-11 sm:h-auto';

  const confirmAction = actions.find((a) => a.action === pending) ?? null;

  return (
    <>
      <div className={compact ? 'flex flex-wrap gap-1.5' : 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'}>
        {phase === 'En preparación' && canWeigh ? (
          <Button
            variant="primary"
            size={size}
            onPress={() => setWeighOpen('close')}
            className={btnClass}
          >
            <Scale className="h-4 w-4" aria-hidden />
            Pesar y cerrar
          </Button>
        ) : null}
        {actions.map((a) => {
          const Icon = ICONS[a.action];
          const primary = a.action === 'dispatch' || a.action === 'deliver';
          return (
            <Button
              key={a.action}
              variant={primary ? 'primary' : a.action === 'fail' ? 'danger' : 'tertiary'}
              size={size}
              onPress={() =>
                a.action === 'deliver' ? setDeliverOpen(true) : setPending(a.action)
              }
              className={btnClass}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {a.label}
            </Button>
          );
        })}
        {!compact && phase !== 'En preparación' && role === 'admin' ? (
          <Button
            variant="ghost"
            size={size}
            onPress={() => setWeighOpen('correct')}
            className={btnClass}
          >
            <Scale className="h-4 w-4" aria-hidden />
            Corregir peso
          </Button>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        tone={pending === 'fail' ? 'danger' : 'accent'}
        title={confirmAction ? `¿${confirmAction.label}?` : ''}
        description={
          confirmAction ? (
            <>
              La entrega #{delivery.id} de{' '}
              <strong className="text-foreground">{delivery.clientName}</strong>{' '}
              pasará a <strong className="text-foreground">{confirmAction.to}</strong>.
              {pending === 'reopen'
                ? ' Los productos volverán a contar como no entregados.'
                : ''}
            </>
          ) : null
        }
        confirmLabel={confirmAction?.label ?? 'Confirmar'}
        onConfirm={async () => {
          if (!pending) return { ok: false, error: 'Acción no encontrada' };
          const result = await transitionDeliveryStatusAction(delivery.id, pending);
          if (result.ok) {
            toast.success(`Entrega #${delivery.id}: ${confirmAction?.to ?? ''}`, {
              description: `${delivery.clientName}${
                delivery.categoryName ? ` · ${delivery.categoryName}` : ''
              }.`,
            });
            setPending(null);
          }
          return result;
        }}
      />

      <DeliverDialog
        open={deliverOpen}
        delivery={delivery}
        onClose={() => setDeliverOpen(false)}
      />

      <WeighDialog
        open={weighOpen !== null}
        mode={weighOpen ?? 'close'}
        delivery={delivery}
        onClose={() => setWeighOpen(null)}
      />
    </>
  );
}
