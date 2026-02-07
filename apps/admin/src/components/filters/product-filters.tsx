import { useState } from 'react';
import { Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/category/useCategory';
import { useShops } from '@/hooks/shop/useShops';
import type { Category } from '@/types/models/category';
import type { Shop } from '@/types/models/shop';
import { useQueryClient } from '@tanstack/react-query';

export interface ProductFilterState {
  search: string;
  category: string;
  shop: string;
  status: string;
  price_min?: number | '';
  price_max?: number | '';
}

interface ProductFiltersProps {
  filters: ProductFilterState;
  onFiltersChange: (filters: ProductFilterState) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  resultCount?: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  isRefreshing = false,
  resultCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categoriesData } = useCategories();
  const { shops } = useShops();
  const categories: Category[] = categoriesData?.results ?? [];
  const shopList: Shop[] = shops ?? [];

  const queryClient = useQueryClient();

  const activeFiltersCount = [
    filters.search.trim() !== '',
    filters.category !== 'all',
    filters.shop !== 'all',
    filters.status !== 'all',
    !!filters.price_min,
    !!filters.price_max,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<ProductFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleReset = () => {
    onFiltersChange({ search: '', category: 'all', shop: 'all', status: 'all', price_min: '', price_max: '' });
  };

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  return (
    <div className="flex items-center gap-2">
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleInvalidate}
          disabled={isRefreshing}
          title="Actualizar lista"
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative cursor-pointer gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[520px] p-0" align="start">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Filtros de productos</h4>
              </div>

            </div>
            <p className="text-xs text-muted-foreground">Filtra productos por búsqueda, categoría, tienda, estado y rango de precio</p>
          </div>

          <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
            {resultCount !== undefined && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> productos</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="pl-10 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Buscar por nombre, sku o descripción"
                  value={filters.search}
                  onChange={(e) => handleChange({ search: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Categoría</Label>
                <Select value={filters.category} onValueChange={(v) => handleChange({ category: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((c: Category) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Tienda</Label>
                <Select value={filters.shop} onValueChange={(v) => handleChange({ shop: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {shopList.map((s: Shop) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Estado</Label>
                <Select value={filters.status} onValueChange={(v) => handleChange({ status: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Encargado">Encargado</SelectItem>
                    <SelectItem value="Comprado">Comprado</SelectItem>
                    <SelectItem value="Recibido">Recibido</SelectItem>
                    <SelectItem value="Entregado">Entregado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Precio (mín - máx)</Label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    className="w-1/2 rounded-md border px-3 py-2 text-sm"
                    value={filters.price_min ?? ''}
                    onChange={(e) => handleChange({ price_min: e.target.value ? Number(e.target.value) : '' })}
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    className="w-1/2 rounded-md border px-3 py-2 text-sm"
                    value={filters.price_max ?? ''}
                    onChange={(e) => handleChange({ price_max: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-3 border-t bg-muted/20">
            <Button variant="outline" onClick={handleReset} disabled={activeFiltersCount === 0} className="flex-1 h-9 text-sm">Limpiar</Button>
            <Button onClick={() => setIsOpen(false)} className="flex-1 h-9 text-sm">Aplicar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProductFilters;
