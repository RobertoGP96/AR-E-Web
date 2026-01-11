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
  const [open, setOpen] = useState(false);

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
      setOpen(false); // Cerrar el popover
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Seleccionar Producto
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[90vw] max-w-3xl max-h-[80vh] overflow-y-auto p-4"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        side="bottom"
      >
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
          <div className="space-y-2 mt-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductSummaryRow
                    product={product}
                    selectable={true}
                    isSelected={selectedProducts.some(p => p.id === product.id)}
                    onSelect={handleSelectProduct}
                  />
                </div>
              ))
            )}
          </div>

          {/* Botón de crear/confirmar */}
          <div className="sticky bottom-0 bg-white pt-4 border-t -mx-4 px-4 -mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedProducts.length} {selectedProducts.length === 1 ? 'producto' : 'productos'} seleccionados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                {selectionMode ? (
                  <Button
                    onClick={handleConfirmSelection}
                    disabled={selectedProducts.length === 0}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Agregar a Compra
                  </Button>
                ) : (
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
                    Crear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SelectedProductsForPurchase;