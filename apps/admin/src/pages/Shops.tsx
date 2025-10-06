import { useState } from 'react';
import { ShopsHeader, ShopsTable } from '@/components/shops';
import type { Shop } from '@/types/models/shop';

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);

  const handleShopUpdated = (updatedShop: Shop) => {
    setShops(prev => prev.map(shop =>
      shop.id === updatedShop.id ? updatedShop : shop
    ));
  };

  const handleDelete = (shop: Shop) => {
    // Lógica para eliminar tienda
    setShops(prev => prev.filter(s => s.id !== shop.id));
  };

  return (
    <div className="space-y-6">
      <ShopsHeader />

      <ShopsTable
        shops={shops.length > 0 ? shops : undefined}
        onShopUpdated={handleShopUpdated}
        onDelete={handleDelete}
      />
    </div>
  );
}
