import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ShopsFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddShop?: () => void;
  searchPlaceholder?: string;
}

export default function ShopsFilters({
  searchValue = "",
  onSearchChange,
  onAddShop,
  searchPlaceholder = "Buscar tiendas..."
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
          <Button 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            onClick={onAddShop}
          >
            <Plus className="h-5 w-5" />
            Nueva Tienda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
