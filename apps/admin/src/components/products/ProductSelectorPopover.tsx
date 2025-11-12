import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Filter, X, ShoppingBag, Box, Briefcase, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, ProductStatus } from '@/types';
import { PRODUCT_STATUSES } from '@/types';

interface ProductSelectorPopoverProps {
  products: Product[];
  value?: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function ProductSelectorPopover({
  products,
  value,
  onSelect,
  placeholder = "Seleccionar producto...",
  disabled = false,
}: ProductSelectorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map(p => p.category).filter(Boolean))
    ) as string[];
    return uniqueCategories;
  }, [products]);

  // Obtener tiendas únicas
  const shops = useMemo(() => {
    const uniqueShops = Array.from(
      new Set(products.map(p => p.shop).filter(Boolean))
    ) as string[];
    return uniqueShops.sort();
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesShop = shopFilter === 'all' || product.shop === shopFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesShop;
    });
  }, [products, searchQuery, statusFilter, categoryFilter, shopFilter]);

  const selectedProduct = products.find(p => p.id === value);

  const handleSelect = (productId: string) => {
    onSelect(productId);
    setOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setShopFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || categoryFilter !== 'all' || shopFilter !== 'all';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedProduct.name}</span>
              {
                selectedProduct.sku && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedProduct.sku}
                  </Badge>
                )
              }
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-3 border-b">
          {/* Barra de búsqueda */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductStatus | 'all')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.values(PRODUCT_STATUSES).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={shopFilter} onValueChange={setShopFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop} value={shop}>
                    {shop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón para limpiar filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full h-8 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <ScrollArea className="h-64">
          <div className="p-1">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border mb-2 ",
                    value === product.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent border-gray-200/70"
                  )}
                >
                  <div className="flex items-center justify-center shrink-0">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === product.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Encabezado del producto */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          {product.sku && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {product.sku}
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-xs">{product.shop}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-row gap-1 items-center justify-center min-w-[140px]">
                        <div className="flex items-center gap-1">
                          <Box className="h-4 w-4" />
                          {product.amount_requested}
                        </div>

                        <div className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          {product.amount_purchased}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {product.amount_received}
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {product.amount_delivered}
                        </div>
                      </div>


                    </div>

                    
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export { ProductSelectorPopover };