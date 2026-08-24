'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PaymentPanel } from '@/components/payment-panel';
import { confirmDeliveryPaymentAction } from './actions';
import { formatCurrency } from '@/lib/format';
import type { DeliveryRow } from './schema';

export function ConfirmDeliveryPaymentDialog({
  delivery,
  onClose,
}: {
  delivery: DeliveryRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const pendingCost = Math.max(
    0,
    delivery.weightCost - delivery.paymentAmount - delivery.balanceApplied
  );

  return (
    <PaymentPanel
      clientName={delivery.clientName}
      clientBalance={delivery.clientBalance}
      pendingCost={pendingCost}
      onSubmit={(amount, applied, manual) =>
        confirmDeliveryPaymentAction(delivery.id, amount, applied, manual)
      }
      onSuccess={(amount) => {
        toast.success(`Pago confirmado para la entrega #${delivery.id}`, {
          description: `Se registró ${formatCurrency(amount)} como pago.`,
        });
        router.refresh();
        onClose();
      }}
      onClose={onClose}
    />
  );
}
