import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAddProductsToPackage } from '@/hooks/package';
import type { AddProductsToPackageData } from '@/hooks/package';
import { useProducts } from '@/hooks/product/useProducts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { ProductSelectorPopover } from '@/components/products/ProductSelectorPopover';

interface ProductEntry extends Omit<AddProductsToPackageData, 'original_product'> {
  id: string; // Para identificar cada entrada en la lista
  original_product: string; // Cambiado a string para coincidir con Product.id
}

export default function AddProductsToPackagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const packageId = id ? parseInt(id) : 0;

  const addProductsMutation = useAddProductsToPackage();
  const { products } = useProducts();

  // Estado del formulario
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([
    { id: '1', original_product: '', amount_received: 1 }
  ]);

  // Función para agregar una nueva entrada de producto
  const addProductEntry = () => {
    const newId = Date.now().toString();
    setProductEntries(prev => [...prev, {
      id: newId,
      original_product: '',
      amount_received: 1
    }]);
  };

  // Función para remover una entrada de producto
  const removeProductEntry = (id: string) => {
    if (productEntries.length > 1) {
      setProductEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Función para actualizar una entrada de producto
  const updateProductEntry = (id: string, field: keyof ProductEntry, value: string | number) => {
    setProductEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que al menos haya un producto
    if (productEntries.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    // Validar cada entrada
    for (const entry of productEntries) {
      if (!entry.original_product || entry.original_product === '') {
        toast.error('Todos los productos deben ser seleccionados');
        return;
      }
      if (!entry.amount_received || entry.amount_received <= 0) {
        toast.error('La cantidad recibida debe ser mayor a 0');
        return;
      }
    }

    try {
      // Preparar los datos para enviar (sin el campo id)
      const productsToSend: AddProductsToPackageData[] = productEntries.map(entry => ({
        original_product: parseInt(entry.original_product),
        amount_received: entry.amount_received
      }));

      await addProductsMutation.mutateAsync({
        packageId,
        products: productsToSend
      });

      toast.success(`Se agregaron ${productEntries.length} productos al paquete exitosamente`);

      // Resetear formulario y navegar de vuelta
      setProductEntries([{ id: '1', original_product: '', amount_received: 1 }]);
      navigate('/packages');
    } catch (error) {
      console.error('Error adding products to package:', error);
      toast.error('No se pudieron agregar los productos al paquete. Por favor intenta de nuevo.');
    }
  };

  const handleCancel = () => {
    navigate('/packages');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/packages')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Paquetes
        </Button>
        <h1 className="text-2xl font-bold">Agregar Productos al Paquete #{packageId}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {productEntries.map((entry, index) => (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Producto {index + 1}</h4>
                {productEntries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProductEntry(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Producto */}
                <div className="grid gap-2">
                  <Label htmlFor={`product-${entry.id}`}>
                    Producto <span className="text-red-500">*</span>
                  </Label>
                  <ProductSelectorPopover
                    products={products}
                    value={entry.original_product}
                    onSelect={(productId) =>
                      updateProductEntry(entry.id, 'original_product', productId)
                    }
                    placeholder="Selecciona un producto"
                    disabled={false}
                  />
                </div>

                {/* Cantidad */}
                <div className="grid gap-2">
                  <Label htmlFor={`amount-${entry.id}`}>
                    Cantidad Recibida <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`amount-${entry.id}`}
                    type="number"
                    min="1"
                    value={entry.amount_received}
                    onChange={(e) =>
                      updateProductEntry(entry.id, 'amount_received', parseInt(e.target.value) || 1)
                    }
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addProductEntry}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Otro Producto
          </Button>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={addProductsMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={addProductsMutation.isPending}>
            {addProductsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              `Agregar ${productEntries.length} Producto${productEntries.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}