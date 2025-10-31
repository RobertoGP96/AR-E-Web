import { ProductsHeader, ProductsTable } from '@/components/products';
import ProductFilters from '@/components/filters/product-filters';
import type { ProductFilterState } from '@/components/filters/product-filters';
import { useProducts } from '@/hooks/product/useProducts';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import type { ProductFilters as ApiProductFilters } from '@/types/api';
import type { VisibleColumn } from '@/components/products/ProductsColumnsSelector';
import { CompactMetricsSummary } from '@/components/metrics';

export default function Products() {
  // Estados para filtros (usados por el nuevo ProductFilters popover)
  const [productFilters, setProductFilters] = useState<ProductFilterState>({
    search: '',
    category: 'all',
    shop: 'all',
    status: 'all',
    price_min: '',
    price_max: '',
  });

  const apiFilters = useMemo<ApiProductFilters>(() => {
    const f: ApiProductFilters = {};
    if (productFilters.search) f.search = productFilters.search;
    if (productFilters.category && productFilters.category !== 'all') f.category = productFilters.category;
    if (productFilters.status && productFilters.status !== 'all') f.status = productFilters.status;
    if (productFilters.shop && productFilters.shop !== 'all') f.shop = Number(productFilters.shop);
    if (productFilters.price_min !== '' && productFilters.price_min !== undefined) f.price_min = Number(productFilters.price_min);
    if (productFilters.price_max !== '' && productFilters.price_max !== undefined) f.price_max = Number(productFilters.price_max);
    return f;
  }, [productFilters]);

  // Obtener productos desde la API con filtros
  const { products, isLoading, error } = useProducts(apiFilters);


  const [visibleColumns, setVisibleColumns] = useState<VisibleColumn[]>(['name','category','status','total_cost','actions', 'shop', 'amount_requested']);

  // Mostrar error si existe
  if (error) {
    toast.error('Error al cargar productos', {
      description: error.message || 'No se pudieron cargar los productos',
    });
  }

  return (
    <div className="space-y-6">
      <ProductsHeader />
      
      {/* Métricas compactas de productos */}
      <CompactMetricsSummary type="products" />
      
      {/* Barra de búsqueda y control de columnas (popover) */}
      <ProductFilters
        filters={productFilters}
        onFiltersChange={setProductFilters}
        resultCount={products.length}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumns(cols)}
      />

  <ProductsTable products={products} isLoading={isLoading} visibleColumns={visibleColumns} />
    </div>
  );
}
