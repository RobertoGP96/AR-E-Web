import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { Order } from '@/types';
import { ProductForm } from '@/components/products/ProductForm';
import type { CreateProductData } from '@/services/products/create-product';
import { createProduct } from '@/services/products/create-product';
import { toast } from 'sonner';

interface AddProductsDialogProps {
  order?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (order: Order, products: CreateProductData[]) => void;
}

export default function AddProductsDialog({ order = null, open, onOpenChange }: AddProductsDialogProps) {
  const [errors, setErrors] = useState<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      setErrors(null);
    }
  }, [open]);

  const handleProductSubmit = async (product: CreateProductData) => {
    if (!order) {
      setErrors('Orden no encontrada');
      return;
    }

    try {
      await createProduct(product);
      toast.success('Producto añadido correctamente.');
      onOpenChange(false);
    } catch (err: unknown) {
      let msg = 'Error creando producto';
      if (err && typeof err === 'object' && 'message' in err) {
        const e = err as { message?: unknown };
        if (typeof e.message === 'string') msg = e.message;
      }
      setErrors(msg);
      toast.error(`Error creando producto: ${msg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Añadir producto al pedido {order ? `#${order.id}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errors && (
            <div className="text-sm text-red-600">{errors}</div>
          )}
          <div className="p-2 bg-white rounded-md">
            <ProductForm onSubmit={handleProductSubmit} orderId={order?.id} />
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
