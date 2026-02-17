import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Truck } from 'lucide-react';
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
import { toast } from 'sonner';
import { useSingleDelivery } from '@/hooks/delivery';
import { useRemoveProductFromDelivery } from '@/hooks/delivery/useRemoveProductFromDelivery';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

interface DeliveryProductsListProps {
  deliveryId: number;
  refreshTrigger?: number;
  onProductDeleted?: () => void;
}

const DeliveryProductsList: React.FC<DeliveryProductsListProps> = ({
  deliveryId,
  refreshTrigger,
  onProductDeleted,
}) => {
  const { delivery, isLoading, refetch } = useSingleDelivery(deliveryId);
  const { mutateAsync: removeProduct, isPending: isDeleting } = useRemoveProductFromDelivery();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const products = delivery?.delivered_products || [];

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleDeleteClick = (id: number) => {
    setSelectedProductId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;

    try {
      await removeProduct({
        deliveryId,
        productDeliveryId: selectedProductId,
      });
      toast.success('Producto eliminado de la entrega');
      onProductDeleted?.();
      setDeleteDialogOpen(false);
      setSelectedProductId(null);
    } catch (error) {
      console.error('Error deleting product from delivery:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProductId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size='md'/>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Truck className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay productos en esta entrega
        </h3>
        <p className="text-sm text-gray-500">
          Agrega productos a esta entrega usando el formulario anterior.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Fecha Recepción</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="capitalize">
                  {product.original_product?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.original_product?.sku || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {product.amount_delivered || 0}
                </TableCell>
                <TableCell className="text-right">
                  ${product.original_product?.total_cost?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>
                  {product.reception ? new Date(product.reception).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(product.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Alert Dialog para confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto de la entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este producto de la entrega? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeliveryProductsList;
