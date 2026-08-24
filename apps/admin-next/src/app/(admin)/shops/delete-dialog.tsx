'use client';

import { deleteShopAction } from './actions';
import { ConfirmModal } from '@/components/ui';
import type { ShopRow } from './schema';

interface DeleteShopDialogProps {
  shop: ShopRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteShopDialog({
  shop,
  onClose,
  onSuccess,
}: DeleteShopDialogProps) {
  return (
    <ConfirmModal
      isOpen={shop !== null}
      onClose={onClose}
      title="¿Eliminar tienda?"
      description={
        shop ? (
          <>
            Se eliminará{' '}
            <strong className="text-foreground">{shop.name}</strong>. Si
            existen productos, cuentas o recibos de compra que la referencien,
            la eliminación fallará y tendrás que reasignarlos primero.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!shop) return { ok: false, error: 'Tienda no encontrada' };
        const result = await deleteShopAction(shop.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
