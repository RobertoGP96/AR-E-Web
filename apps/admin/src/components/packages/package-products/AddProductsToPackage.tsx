import React from 'react';
import SelectedProductsForPackage from './SelectedProductsForPackage';

interface AddProductsToPackageProps {
  packageId: number;
  onProductsAdded?: () => void;
}

const AddProductsToPackage: React.FC<AddProductsToPackageProps> = ({
  packageId,
  onProductsAdded,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecciona los productos que deseas agregar a este paquete
      </p>
      <SelectedProductsForPackage
        packageId={packageId}
        onProductsAdded={onProductsAdded}
      />
    </div>
  );
};

export default AddProductsToPackage;
