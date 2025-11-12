import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackage } from '@/hooks/package';
import { useRemoveProductFromPackage } from '@/hooks/package';
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
import type { ProductReceived } from '@/types';

export default function RemoveProductsFromPackagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const packageId = id ? parseInt(id) : 0;

  const { package: packageData, isLoading } = usePackage(packageId);
  const removeProductMutation = useRemoveProductFromPackage();

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const containedProducts = packageData?.contained_products || [];

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
    if (selectedProducts.length === containedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(containedProducts.map((p: { id: number }) => p.id));
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
          packageId,
          productReceivedId: productId
        });
      }

      toast.success(
        `Se ${selectedProducts.length === 1 ? 'eliminó' : 'eliminaron'} ${selectedProducts.length} producto${selectedProducts.length > 1 ? 's' : ''} del paquete exitosamente`
      );

      // Resetear selección y navegar de vuelta
      setSelectedProducts([]);
      navigate('/packages');
    } catch (error) {
      console.error('Error removing products from package:', error);
      toast.error('No se pudieron eliminar los productos del paquete. Por favor intenta de nuevo.');
    } finally {
      setIsRemoving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    navigate('/packages');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!packageData) {
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
          <h1 className="text-2xl font-bold">Paquete no encontrado</h1>
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
            onClick={() => navigate('/packages')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Paquetes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Eliminar Productos del Paquete #{packageData.agency_name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona los productos que deseas eliminar del paquete
            </p>
          </div>
        </div>

        {containedProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <PackageIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay productos en este paquete
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Este paquete no contiene productos para eliminar
              </p>
              <Button onClick={handleCancel}>
                Volver a Paquetes
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProducts.length === containedProducts.length && containedProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="font-medium text-sm">
                    {selectedProducts.length === 0
                      ? 'Seleccionar todos'
                      : `${selectedProducts.length} de ${containedProducts.length} seleccionado${selectedProducts.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {selectedProducts.length > 0 && (
                  <Badge variant="destructive">
                    {selectedProducts.length} para eliminar
                  </Badge>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {containedProducts.map((product: ProductReceived) => (
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
                              Cantidad: {product.amount_received}
                            </span>
                          </div>
                          {product.observation && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              Observación: {product.observation}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          x{product.amount_received}
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
              ¿Eliminar productos del paquete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} del paquete #{packageData.agency_name}.
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
