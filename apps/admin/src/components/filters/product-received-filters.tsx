import { useState } from 'react';
import { Filter, Search, Calendar } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useOrders } from '@/hooks/order/useOrders';
import { useProducts } from '@/hooks/product/useProducts';
import { usePackages } from '@/hooks/package/usePackages';

export interface ProductReceivedFilterState {
  search: string;
  order: string;
  original_product: string;
  package_where_was_send: string;
  deliver_receip: string;
  reception_date_from: string;
  reception_date_to: string;
}

interface ProductReceivedFiltersProps {
  filters: ProductReceivedFilterState;
  onFiltersChange: (filters: ProductReceivedFilterState) => void;
  resultCount?: number;
}

export const ProductReceivedFilters: React.FC<ProductReceivedFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cargar opciones dinámicas
  const { orders } = useOrders({ page_size: 100 }); // Cargar más órdenes para el select
  const { products } = useProducts({ page_size: 100 }); // Cargar más productos para el select
  const { packages } = usePackages({ page_size: 100 }); // Cargar más paquetes para el select

  const activeFiltersCount = [
    filters.search.trim() !== '',
    filters.order !== 'all',
    filters.original_product !== 'all',
    filters.package_where_was_send !== 'all',
    filters.deliver_receip !== 'all',
    filters.reception_date_from !== '',
    filters.reception_date_to !== '',
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<ProductReceivedFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      order: 'all',
      original_product: 'all',
      package_where_was_send: 'all',
      deliver_receip: 'all',
      reception_date_from: '',
      reception_date_to: '',
    });
  };

  return (
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
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h4 className="font-semibold text-sm">Filtros de productos recibidos</h4>
          </div>
          <p className="text-xs text-muted-foreground">Filtra recepciones de productos por búsqueda, orden, producto, paquete y fechas</p>
        </div>

        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {resultCount !== undefined && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> recepciones</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por observación o detalles"
                value={filters.search}
                onChange={(e) => handleChange({ search: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Orden</Label>
              <Select value={filters.order} onValueChange={(v) => handleChange({ order: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={String(order.id)}>
                      Orden #{order.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Producto Original</Label>
              <Select value={filters.original_product} onValueChange={(v) => handleChange({ original_product: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (SKU: {product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Paquete</Label>
              <Select value={filters.package_where_was_send} onValueChange={(v) => handleChange({ package_where_was_send: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      Paquete #{pkg.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Recibo de Entrega</Label>
              <Select value={filters.deliver_receip} onValueChange={(v) => handleChange({ deliver_receip: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {/* TODO: Cargar recibos de entrega dinámicamente cuando estén disponibles */}
                  <SelectItem value="1">Recibo #1</SelectItem>
                  <SelectItem value="2">Recibo #2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Fecha de Recepción
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={filters.reception_date_from}
                  onChange={(e) => handleChange({ reception_date_from: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={filters.reception_date_to}
                  onChange={(e) => handleChange({ reception_date_to: e.target.value })}
                  className="h-9 text-sm"
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
  );
};

export default ProductReceivedFilters;