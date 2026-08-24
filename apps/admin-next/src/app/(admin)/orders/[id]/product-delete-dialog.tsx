'use client';

import { deleteProductAction } from '../actions';
import { ConfirmModal } from '@/components/ui';
import type { ProductRow } from '../schema';

interface ProductDeleteDialogProps {
  orderId: string;
  product: ProductRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductDeleteDialog({
  orderId,
  product,
  onClose,
  onSuccess,
}: ProductDeleteDialogProps) {
  return (
    <ConfirmModal
      isOpen={product !== null}
      onClose={onClose}
      title="¿Eliminar producto?"
      description={
        product ? (
          <>
            Se quitará{' '}
            <strong className="text-foreground">{product.name}</strong> de la
            orden y se recalculará el total. Fallará si el producto tiene
            compras, recepciones o entregas vinculadas.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!product) return { ok: false, error: 'Producto no encontrado' };
        const result = await deleteProductAction(orderId, product.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
