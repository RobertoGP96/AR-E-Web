import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Truck, Search, Plus } from 'lucide-react';
import { useProducts } from '@/hooks/product/useProducts';
import { useAddProductToDelivery } from '@/hooks/delivery/useAddProductToDelivery';
import type { Product } from '@/types/models';
import type { ProductFilters } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SelectedProductsForDeliveryProps {
  deliveryId: number;
  onProductsAdded?: () => void;
}

const SelectedProductsForDelivery: React.FC<SelectedProductsForDeliveryProps> = ({
  deliveryId,
  onProductsAdded,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { product: Product; amount: number }>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const filters: ProductFilters = useMemo(() => ({
    status: 'Recibido',
  }), []);

  const { products, isLoading, error } = useProducts(filters);
  const { mutateAsync: addProduct, isPending: isAdding } = useAddProductToDelivery();

  // Filter products locally for search
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        newMap.set(product.id, { product, amount: 1 });
      }
      return newMap;
    });
  };

  const handleAmountChange = (productId: string, amount: number) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(productId);
      if (item && amount > 0) {
        newMap.set(productId, { ...item, amount });
      }
      return newMap;
    });
  };

  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    try {
      // Add products one by one
      for (const { product, amount } of selectedProducts.values()) {
        await addProduct({
          deliveryId,
          productId: product.id,
          amount,
        });
      }

      toast.success(`${selectedProducts.size} producto(s) agregado(s) a la entrega`);
      setSelectedProducts(new Map());
      setOpen(false);
      onProductsAdded?.();
    } catch (error) {
      console.error('Error adding products to delivery:', error);
      toast.error('Error al agregar productos a la entrega');
    }
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Seleccionar Productos
            {selectedProducts.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedProducts.size}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <div className="flex flex-col h-[400px]">
            {/* Search Header */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error al cargar productos
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay productos disponibles
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.has(product.id);
                    const selectedItem = selectedProducts.get(product.id);

                    return (
                      <div
                        key={product.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.sku}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ${product.total_cost?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {isSelected && selectedItem && (
                            <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                min="1"
                                value={selectedItem.amount}
                                onChange={(e) => handleAmountChange(product.id, parseInt(e.target.value) || 1)}
                                className="w-20 h-8"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedProducts.size} producto(s) seleccionado(s)
                </p>
                <Button
                  onClick={handleAddProducts}
                  disabled={selectedProducts.size === 0 || isAdding}
                  size="sm"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-2 h-4 w-4" />
                      Agregar a Entrega
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Products Summary */}
      {selectedProducts.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Productos Seleccionados:</h4>
          <div className="space-y-2">
            {Array.from(selectedProducts.values()).map(({ product, amount }) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    Cantidad: {amount}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectProduct(product)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedProductsForDelivery;
