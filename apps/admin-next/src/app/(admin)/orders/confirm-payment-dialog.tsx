'use client';

import { useCallback } from 'react';
import { toast } from '@/lib/toast';
import { PaymentPanel } from '@/components/payment-panel';
import { confirmOrderPaymentAction } from './actions';
import { loadClientPendingTargetsAction } from '../surplus-actions';
import { formatCurrency } from '@/lib/format';
import type { OrderRow } from './schema';

export function ConfirmPaymentDialog({
  order,
  onClose,
}: {
  order: OrderRow;
  onClose: () => void;
}) {
  const pendingCost = Math.max(
    0,
    order.totalCosts - order.receivedValueOfClient - order.balanceApplied
  );
  // RN-023: pendientes del cliente para repartir un posible excedente.
  const loadPendingTargets = useCallback(
    () => loadClientPendingTargetsAction(order.clientId, 'order', order.id),
    [order.clientId, order.id]
  );

  return (
    <PaymentPanel
      clientName={order.clientName}
      clientBalance={order.clientBalance}
      pendingCost={pendingCost}
      loadPendingTargets={loadPendingTargets}
      onSubmit={(amount, applied, manual, distribute) =>
        confirmOrderPaymentAction(order.id, amount, applied, manual, distribute)
      }
      onSuccess={(amount, result) => {
        const r = result.redistributed;
        toast.success(`Pago confirmado para el pedido #${order.id}`, {
          description: r
            ? `Se registró ${formatCurrency(amount)}; ${formatCurrency(r.moved)} cubrieron ${r.count} partida${r.count === 1 ? '' : 's'} pendiente${r.count === 1 ? '' : 's'} del cliente.`
            : `Se registró ${formatCurrency(amount)} como cantidad recibida.`,
        });
        onClose();
      }}
      onClose={onClose}
    />
  );
}
