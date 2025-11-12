import { useState } from 'react';
import { useAddProductsToPackage } from '@/hooks/package';
import type { AddProductsToPackageData } from '@/hooks/package';
import type { CreateProductReceivedData } from '@/types';
import { useProducts } from '@/hooks/product/useProducts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

interface AddProductsToPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number;
  packageName?: string;
}

interface ProductEntry extends AddProductsToPackageData {
  id: string; // Para identificar cada entrada en la lista
}

export default function AddProductsToPackageDialog({
  open,
  onOpenChange,
  packageId,
  packageName
}: AddProductsToPackageDialogProps) {
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
      // Preparar los datos para enviar (convertir original_product a original_product_id)
      const productsToSend: CreateProductReceivedData[] = productEntries.map(entry => ({
        original_product_id: entry.original_product,
        amount_received: entry.amount_received
      }));

      await addProductsMutation.mutateAsync({
        packageId,
        products: productsToSend
      });

      toast.success(`Se agregaron ${productEntries.length} productos al paquete exitosamente`);

      // Resetear formulario y cerrar diálogo
      setProductEntries([{ id: '1', original_product: '', amount_received: 1 }]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding products to package:', error);
      toast.error('No se pudieron agregar los productos al paquete. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Productos al Paquete</DialogTitle>
          <DialogDescription>
            Agregue productos recibidos al paquete {packageName && `"${packageName}"`}.
            Puede agregar múltiples productos a la vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
                    <Select
                      value={entry.original_product}
                      onValueChange={(value) =>
                        updateProductEntry(entry.id, 'original_product', value)
                      }
                    >
                      <SelectTrigger id={`product-${entry.id}`}>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (SKU: {product.sku})
                          </SelectItem>
                        ))}
                        {products.length === 0 && (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            No hay productos disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
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

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}