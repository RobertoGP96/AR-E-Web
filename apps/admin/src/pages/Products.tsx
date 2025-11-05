import { ProductsHeader, ProductsTable } from '@/components/products';
import { ProductEditDialog } from '@/components/products/ProductEditDialog';
import ProductFilters from '@/components/filters/product-filters';
import type { ProductFilterState } from '@/components/filters/product-filters';
import { useProducts } from '@/hooks/product/useProducts';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import type { ProductFilters as ApiProductFilters } from '@/types/api';
import type { VisibleColumn } from '@/components/products/ProductsColumnsSelector';
import ProductsColumnsSelector from '@/components/products/ProductsColumnsSelector';
import { CompactMetricsSummary } from '@/components/metrics';
import type { Product } from '@/types/models';

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

  // Estado para el diálogo de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  // Manejador para abrir el diálogo de edición
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  // Manejador para cerrar el diálogo de edición
  const handleCloseEditDialog = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

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
      
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <ProductFilters
            filters={productFilters}
            onFiltersChange={setProductFilters}
            resultCount={products.length}
          />
        </div>
        
        {/* Selector de columnas visibles */}
        <ProductsColumnsSelector 
          value={visibleColumns} 
          onChange={setVisibleColumns}
        />
      </div>

      <ProductsTable 
        products={products} 
        isLoading={isLoading} 
        visibleColumns={visibleColumns}
        onEdit={handleEdit}
      />

      {/* Diálogo de edición */}
      <ProductEditDialog
        product={editingProduct}
        open={isEditDialogOpen}
        onOpenChange={handleCloseEditDialog}
      />
    </div>
  );
}
