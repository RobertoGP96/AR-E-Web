import React from 'react';
import SelectedProductsForPurchase from '@/components/products/selected-products-for-purchase';
import type { ProductBuyed } from '@/types/models/product-buyed';
import { toast } from 'sonner';

interface AddProductsToPurchaseProps {
  shoppingReceiptId: number;
  onProductsAdded?: () => void;
}

const AddProductsToPurchase: React.FC<AddProductsToPurchaseProps> = ({
  shoppingReceiptId,
  onProductsAdded,
}) => {
  const handleProductBuyedCreated = (productBuyed: ProductBuyed) => {
    console.log('Product buyed created:', productBuyed);
    toast.success('Producto agregado a la compra');
    onProductsAdded?.();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecciona los productos que deseas agregar a esta compra
      </p>
      <SelectedProductsForPurchase
        filters={{}}
        orderId={0} // No se requiere en este contexto
        shoppingReceiptId={shoppingReceiptId}
        onProductBuyedCreated={handleProductBuyedCreated}
        selectionMode={false}
      />
    </div>
  );
};

export default AddProductsToPurchase;
