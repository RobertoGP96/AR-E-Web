import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, ShoppingCart, Search } from 'lucide-react';
import { useProducts } from '@/hooks/product/useProducts';
import { useCreateProductBuyed } from '@/hooks/product/useCreateProductBuyed';
import type { Product } from '@/types/models';
import type { ProductFilters } from '@/types/api';
import type { ProductBuyed } from '@/types/models/product-buyed';
import ProductSummaryRow from './buyed/product-summary-row';

interface SelectedProductsForPurchaseProps {
  filters: ProductFilters;
  orderId: number;
  shoppingReceiptId: number;
  shopId?: number;
  onProductBuyedCreated?: (productBuyed: ProductBuyed) => void;
  onProductsConfirmed?: (products: Product[]) => void;
  selectionMode?: boolean;
}

const SelectedProductsForPurchase: React.FC<SelectedProductsForPurchaseProps> = ({
  filters,
  orderId,
  shoppingReceiptId,
  shopId,
  onProductBuyedCreated,
  onProductsConfirmed,
  selectionMode = false,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Update filters based on internal state
  const updatedFilters: ProductFilters = useMemo(() => ({
    ...filters,
    shop: shopId,
    status: 'Encargado',
  }), [filters, shopId]);

  const { products, isLoading, error } = useProducts(updatedFilters);
  const { createProductBuyed, isCreating } = useCreateProductBuyed();

  // Filter products locally for search
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  };

  const handleConfirmSelection = () => {
    if (selectionMode && onProductsConfirmed && selectedProducts.length > 0) {
      onProductsConfirmed(selectedProducts);
      setSelectedProducts([]); // Limpiar selección después de confirmar
    }
  };

  const handleCreateProductBuyed = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const createdProducts = await Promise.all(
        selectedProducts.map(async (product) => {
          const data = {
            original_product: product.id,
            order: orderId,
            actual_cost_of_product: product.total_cost || 0,
            shop_discount: 0,
            offer_discount: 0,
            buy_date: new Date().toISOString(),
            shoping_receip: shoppingReceiptId,
            amount_buyed: 1, // Default to 1, can be modified later
            observation: '',
            real_cost_of_product: product.total_cost || 0,
          };
          return await createProductBuyed(data);
        })
      );

      // Call callback for each created product
      createdProducts.forEach(productBuyed => {
        onProductBuyedCreated?.(productBuyed);
      });

      // Clear selection after creation
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error creating product buyed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error al cargar productos: {error.message}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Seleccionar Producto
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductSummaryRow
                  key={product.id}
                  product={product}
                  selectable={true}
                  isSelected={selectionMode ? false : selectedProducts.some(p => p.id === product.id)}
                  onSelect={handleSelectProduct}
                />
              ))
            )}
          </div>

          {/* Botón de crear/confirmar */}
          {selectionMode ? (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedProducts.length === 0}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar a Compra ({selectedProducts.length})
              </Button>
            </div>
          ) : (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleCreateProductBuyed}
                disabled={isCreating || selectedProducts.length === 0}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Crear ({selectedProducts.length})
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SelectedProductsForPurchase;