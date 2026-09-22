'use client';

import { deleteDeliveryAction } from './actions';
import { formatCurrency } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { DeliveryRow } from './schema';

interface DeleteDeliveryDialogProps {
  delivery: DeliveryRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteDeliveryDialog({
  delivery,
  onClose,
  onSuccess,
}: DeleteDeliveryDialogProps) {
  return (
    <ConfirmModal
      isOpen={delivery !== null}
      onClose={onClose}
      title="¿Eliminar entrega?"
      description={
        delivery ? (
          <>
            Se eliminará la entrega de{' '}
            <strong className="text-foreground">{delivery.clientName}</strong> (
            {formatCurrency(delivery.weightCost)}) y se recalculará su balance.
            Si es una bolsa en preparación, sus unidades vuelven a «recibido sin
            bolsa»; una entrega pesada debe estar sin productos y sin pagos.
            Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!delivery) return { ok: false, error: 'Entrega no encontrada' };
        const result = await deleteDeliveryAction(delivery.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
