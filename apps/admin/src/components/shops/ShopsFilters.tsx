import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ShopFormPopover from './form/ShopFormPopover';
import type { Shop } from '@/types/models/shop';

interface ShopsFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onShopCreated?: (shop: Shop) => void;
}

export default function ShopsFilters({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar tiendas...",
  onShopCreated
}: ShopsFiltersProps) {
  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-10"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>
          <div>
            <ShopFormPopover
              mode="create"
              onSuccess={onShopCreated}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
