import { useState } from 'react';
import { ShopsHeader, ShopsFilters, ShopsStats, ShopsTable } from '@/components/shops';
import type { ShopTableData } from '@/types/models/shopTable';

export default function Shops() {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Aquí puedes agregar lógica de filtrado
  };

  const handleAddShop = () => {
    // Lógica para agregar nueva tienda
    console.log("Agregar nueva tienda");
  };

  const handleViewDetails = (shop: ShopTableData) => {
    // Lógica para ver detalles de la tienda
    console.log("Ver detalles de:", shop.name);
  };

  const handleEdit = (shop: ShopTableData) => {
    // Lógica para editar tienda
    console.log("Editar tienda:", shop.name);
  };

  const handleViewReports = (shop: ShopTableData) => {
    // Lógica para ver reportes
    console.log("Ver reportes de:", shop.name);
  };

  return (
    <div className="space-y-6">
      <ShopsHeader />
      
      <ShopsFilters
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onAddShop={handleAddShop}
      />

      <ShopsStats />

      <ShopsTable
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onViewReports={handleViewReports}
      />
    </div>
  );
}
