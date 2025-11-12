import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSingleDelivery } from '@/hooks/delivery';
import { useRemoveProductFromDelivery } from '@/hooks/delivery';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ArrowLeft, Package as PackageIcon, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ProductDelivery } from '@/types';

export default function RemoveProductsFromDeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deliveryId = id ? parseInt(id) : 0;

  const { delivery: deliveryData, isLoading } = useSingleDelivery(deliveryId);
  const removeProductMutation = useRemoveProductFromDelivery();

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const deliveredProducts = deliveryData?.delivered_products || [];

  // Función para toggle selección de producto
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Función para seleccionar/deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedProducts.length === deliveredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(deliveredProducts.map((p: ProductDelivery) => p.id));
    }
  };

  const handleRemoveProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    setIsRemoving(true);
    try {
      // Remover productos uno por uno
      for (const productId of selectedProducts) {
        await removeProductMutation.mutateAsync({
          deliveryId,
          productDeliveryId: productId
        });
      }

      toast.success(
        `Se ${selectedProducts.length === 1 ? 'eliminó' : 'eliminaron'} ${selectedProducts.length} producto${selectedProducts.length > 1 ? 's' : ''} del delivery exitosamente`
      );

      // Resetear selección y navegar de vuelta
      setSelectedProducts([]);
      navigate('/delivery');
    } catch (error) {
      console.error('Error removing products from delivery:', error);
      toast.error('No se pudieron eliminar los productos del delivery. Por favor intenta de nuevo.');
    } finally {
      setIsRemoving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    navigate('/delivery');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!deliveryData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/delivery')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Deliveries
          </Button>
          <h1 className="text-2xl font-bold">Delivery no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/delivery')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Deliveries
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Eliminar Productos del Delivery #{deliveryData.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona los productos que deseas eliminar del delivery
            </p>
          </div>
        </div>

        {deliveredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <PackageIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay productos en este delivery
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Este delivery no contiene productos para eliminar
              </p>
              <Button onClick={handleCancel}>
                Volver a Deliveries
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProducts.length === deliveredProducts.length && deliveredProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="font-medium text-sm">
                    {selectedProducts.length === 0
                      ? 'Seleccionar todos'
                      : `${selectedProducts.length} de ${deliveredProducts.length} seleccionado${selectedProducts.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {selectedProducts.length > 0 && (
                  <Badge variant="destructive">
                    {selectedProducts.length} para eliminar
                  </Badge>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {deliveredProducts.map((product: ProductDelivery) => (
                  <div
                    key={product.id}
                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                      selectedProducts.includes(product.id) ? 'bg-red-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {product.original_product.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <PackageIcon className="h-4 w-4" />
                              Cantidad: {product.amount_delivered}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          x{product.amount_delivered}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isRemoving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowConfirmDialog(true)}
                disabled={selectedProducts.length === 0 || isRemoving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar {selectedProducts.length > 0 ? `${selectedProducts.length} Producto${selectedProducts.length > 1 ? 's' : ''}` : 'Productos'}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Eliminar productos del delivery?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} del delivery #{deliveryData.id}.
              <br />
              <br />
              Esta acción <span className="font-semibold text-red-600">no se puede deshacer</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)} disabled={isRemoving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveProducts}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Productos'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
