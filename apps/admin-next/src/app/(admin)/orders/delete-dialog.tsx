'use client';

import { deleteOrderAction } from './actions';
import { formatCurrency } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { OrderRow } from './schema';

interface DeleteOrderDialogProps {
  order: OrderRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteOrderDialog({
  order,
  onClose,
  onSuccess,
}: DeleteOrderDialogProps) {
  return (
    <ConfirmModal
      isOpen={order !== null}
      onClose={onClose}
      title="¿Eliminar orden?"
      description={
        order ? (
          <>
            Se eliminará la orden de{' '}
            <strong className="text-foreground">{order.clientName}</strong> (
            {formatCurrency(order.totalCosts)}) y sus {order.productCount}{' '}
            producto(s). El balance del cliente se recalculará. Esta acción no
            se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!order) return { ok: false, error: 'Orden no encontrada' };
        const result = await deleteOrderAction(order.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
