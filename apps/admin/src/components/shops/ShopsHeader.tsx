import { Store } from 'lucide-react';
import ShopFormPopover from './form/ShopFormPopover';
import type { Shop } from '@/types/models/shop';

interface ShopsHeaderProps {
  title?: string;
  description?: string;
  onShopCreated?: (shop: Shop) => void;
}

export default function ShopsHeader({ 
  title = "Tiendas & Cuentas", 
  description = "Gestiona las tiendas y sus cuentas de compra",
  onShopCreated
}: ShopsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Store className="h-8 w-8 text-orange-500" />
          {title}
        </h1>
        <p className="text-gray-600 mt-2">
          {description}
        </p>
      </div>
      
      <ShopFormPopover
        mode="create"
        onSuccess={onShopCreated}
      />
    </div>
  );
}
