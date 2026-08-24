'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PaymentPanel } from '@/components/payment-panel';
import { confirmOrderPaymentAction } from './actions';
import { formatCurrency } from '@/lib/format';
import type { OrderRow } from './schema';

export function ConfirmPaymentDialog({
  order,
  onClose,
}: {
  order: OrderRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const pendingCost = Math.max(
    0,
    order.totalCosts - order.receivedValueOfClient - order.balanceApplied
  );

  return (
    <PaymentPanel
      clientName={order.clientName}
      clientBalance={order.clientBalance}
      pendingCost={pendingCost}
      onSubmit={(amount, applied, manual) =>
        confirmOrderPaymentAction(order.id, amount, applied, manual)
      }
      onSuccess={(amount) => {
        toast.success(`Pago confirmado para el pedido #${order.id}`, {
          description: `Se registró ${formatCurrency(amount)} como cantidad recibida.`,
        });
        router.refresh();
        onClose();
      }}
      onClose={onClose}
    />
  );
}
