import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Order, CreateProductData } from '@/types';
import { ProductForm } from '@/components/products/ProductForm';

interface AddProductsDialogProps {
  order?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (order: Order, products: CreateProductData[]) => void;
}

export default function AddProductsDialog({ order = null, open, onOpenChange, onAdd }: AddProductsDialogProps) {
  const handleProductSubmit = (productData: CreateProductData) => {
    if (order && onAdd) {
      onAdd(order, [productData]);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl ">
        <DialogHeader>
          <DialogTitle>Añadir producto al pedido #{order?.id}</DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[90vh] overflow-y-auto">
          {order ? (
            <ProductForm
              onSubmit={handleProductSubmit}
              orderId={order.id}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No se pudo cargar la información del pedido.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
