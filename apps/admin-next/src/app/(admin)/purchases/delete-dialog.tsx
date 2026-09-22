'use client';

import { deletePurchaseAction } from './actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { PurchaseRow } from './schema';

interface DeletePurchaseDialogProps {
  purchase: PurchaseRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePurchaseDialog({
  purchase,
  onClose,
  onSuccess,
}: DeletePurchaseDialogProps) {
  return (
    <ConfirmModal
      isOpen={purchase !== null}
      onClose={onClose}
      title="¿Eliminar compra?"
      description={
        purchase ? (
          <>
            Se eliminará la compra de{' '}
            <strong className="text-foreground">
              {formatCurrency(purchase.totalCostOfPurchase)}
            </strong>{' '}
            en {purchase.shopName} ({formatDate(purchase.buyDate)}) junto con
            sus {purchase.productCount} producto
            {purchase.productCount === 1 ? '' : 's'} comprado
            {purchase.productCount === 1 ? '' : 's'}, y se recalculará el
            estado de cada producto. Se bloqueará si alguna unidad ya fue
            recibida. Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!purchase) return { ok: false, error: 'Compra no encontrada' };
        const result = await deletePurchaseAction(purchase.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
