import { useState } from 'react';
import { ProductReceivedFilters, type ProductReceivedFilterState } from '@/components/filters/product-received-filters';
import { useProductReceiveds } from '@/hooks/product/useProductReceiveds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, ShoppingCart } from 'lucide-react';

export default function ProductReceivedList() {
  const [filters, setFilters] = useState<ProductReceivedFilterState>({
    search: '',
    order: 'all',
    original_product: 'all',
    package_where_was_send: 'all',
    deliver_receip: 'all',
    reception_date_from: '',
    reception_date_to: '',
  });

  // Convertir filtros del componente a filtros de API
  const apiFilters = {
    ...(filters.search && { search: filters.search }),
    ...(filters.order !== 'all' && { order: parseInt(filters.order) }),
    ...(filters.original_product !== 'all' && { original_product: filters.original_product }),
    ...(filters.package_where_was_send !== 'all' && { package_where_was_send: parseInt(filters.package_where_was_send) }),
    ...(filters.deliver_receip !== 'all' && { deliver_receip: parseInt(filters.deliver_receip) }),
    ...(filters.reception_date_from && { reception_date_from: filters.reception_date_from }),
    ...(filters.reception_date_to && { reception_date_to: filters.reception_date_to }),
  };

  const { productReceiveds, total, isLoading } = useProductReceiveds(apiFilters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos Recibidos</h1>
          <p className="text-muted-foreground">
            Gestiona y filtra las recepciones de productos
          </p>
        </div>
        <ProductReceivedFilters
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={total}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Cargando recepciones...</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {productReceiveds.map((received) => (
            <Card key={received.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {received.original_product.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {received.amount_received} unidades
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-medium">{received.original_product.sku}</span>
                  </div>

                  {received.package && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Paquete:</span>
                      <span className="font-medium">#{received.package.id}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Recibido:</span>
                    <span className="font-medium">
                      {new Date(received.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Orden:</span>
                    <span className="font-medium">
                      #{typeof received.original_product.order === 'number'
                        ? received.original_product.order
                        : received.original_product.order.id}
                    </span>
                  </div>
                </div>

                {received.observation && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Observación:</span> {received.observation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {productReceiveds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron recepciones de productos con los filtros aplicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}