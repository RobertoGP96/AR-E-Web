import { useState } from 'react';
import { ShopsHeader, ShopsFilters, ShopsTable } from '@/components/shops';
import type { Shop } from '@/types/models/shop';

export default function Shops() {
  const [searchValue, setSearchValue] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Aquí puedes agregar lógica de filtrado
  };

  const handleShopCreated = (shop: Shop) => {
    setShops(prev => [...prev, shop]);
    console.log("Nueva tienda creada:", shop.name);
  };

  const handleShopUpdated = (updatedShop: Shop) => {
    setShops(prev => prev.map(shop =>
      shop.id === updatedShop.id ? updatedShop : shop
    ));
    console.log("Tienda actualizada:", updatedShop.name);
  };

  const handleDelete = (shop: Shop) => {
    // Lógica para eliminar tienda
    setShops(prev => prev.filter(s => s.id !== shop.id));
    console.log("Eliminar tienda:", shop.name);
  };

  return (
    <div className="space-y-6">
      <ShopsHeader />

      <ShopsFilters
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onShopCreated={handleShopCreated}
      />

      <ShopsTable
        shops={shops.length > 0 ? shops : undefined}
        onShopUpdated={handleShopUpdated}
        onDelete={handleDelete}
      />
    </div>
  );
}
