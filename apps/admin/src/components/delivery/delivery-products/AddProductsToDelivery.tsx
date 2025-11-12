import React from 'react';
import SelectedProductsForDelivery from './SelectedProductsForDelivery';

interface AddProductsToDeliveryProps {
  deliveryId: number;
  onProductsAdded?: () => void;
}

const AddProductsToDelivery: React.FC<AddProductsToDeliveryProps> = ({
  deliveryId,
  onProductsAdded,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecciona los productos que deseas agregar a esta entrega
      </p>
      <SelectedProductsForDelivery
        deliveryId={deliveryId}
        onProductsAdded={onProductsAdded}
      />
    </div>
  );
};

export default AddProductsToDelivery;
