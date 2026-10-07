'use client';

import { useCallback } from 'react';
import { toast } from '@/lib/toast';
import { PaymentPanel } from '@/components/payment-panel';
import { confirmDeliveryPaymentAction } from './actions';
import { loadClientPendingTargetsAction } from '../surplus-actions';
import { formatCurrency } from '@/lib/format';
import type { DeliveryRow } from './schema';

export function ConfirmDeliveryPaymentDialog({
  delivery,
  onClose,
}: {
  delivery: DeliveryRow;
  onClose: () => void;
}) {
  const pendingCost = Math.max(
    0,
    delivery.weightCost - delivery.paymentAmount - delivery.balanceApplied
  );
  // RN-023: pendientes del cliente para repartir un posible excedente.
  const loadPendingTargets = useCallback(
    () => loadClientPendingTargetsAction(delivery.clientId, 'delivery', delivery.id),
    [delivery.clientId, delivery.id]
  );

  return (
    <PaymentPanel
      clientName={delivery.clientName}
      clientBalance={delivery.clientBalance}
      pendingCost={pendingCost}
      loadPendingTargets={loadPendingTargets}
      onSubmit={(amount, applied, manual, distribute) =>
        confirmDeliveryPaymentAction(delivery.id, amount, applied, manual, distribute)
      }
      onSuccess={(amount, result) => {
        const r = result.redistributed;
        toast.success(`Pago confirmado para la entrega #${delivery.id}`, {
          description: r
            ? `Se registró ${formatCurrency(amount)}; ${formatCurrency(r.moved)} cubrieron ${r.count} partida${r.count === 1 ? '' : 's'} pendiente${r.count === 1 ? '' : 's'} del cliente.`
            : `Se registró ${formatCurrency(amount)} como pago.`,
        });
        onClose();
      }}
      onClose={onClose}
    />
  );
}
