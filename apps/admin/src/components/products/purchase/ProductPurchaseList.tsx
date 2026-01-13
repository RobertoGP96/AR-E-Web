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
import { Loader2, Trash2, Package } from 'lucide-react';
import { useProductsBuyed } from '@/hooks/product/useProductsBuyed';
import { useDeleteProductBuyed } from '@/hooks/product/useDeleteProductBuyed';
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

interface ProductPurchaseListProps {
  productId: number;
  refreshTrigger?: number;
  onPurchaseDeleted?: () => void;
}

const ProductPurchaseList: React.FC<ProductPurchaseListProps> = ({
  productId,
  refreshTrigger,
  onPurchaseDeleted,
}) => {
  const { productsBuyed, isLoading, refetch } = useProductsBuyed({ productId });
  const { deleteProductBuyed, isDeleting } = useDeleteProductBuyed();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleDeleteClick = (id: number) => {
    setSelectedPurchaseId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPurchaseId) return;

    try {
      await deleteProductBuyed(selectedPurchaseId);
      toast.success('Compra eliminada exitosamente');
      onPurchaseDeleted?.();
      setDeleteDialogOpen(false);
      setSelectedPurchaseId(null);
    } catch (error) {
      console.error('Error deleting product purchase:', error);
      toast.error('Error al eliminar la compra');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedPurchaseId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando compras...</span>
      </div>
    );
  }

  if (!productsBuyed || productsBuyed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay compras registradas
        </h3>
        <p className="text-sm text-gray-500">
          Agrega una nueva compra para este producto usando el formulario anterior.
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
              <TableHead>Recibo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Desc. Tienda</TableHead>
              <TableHead className="text-right">Desc. Oferta</TableHead>
              <TableHead className="text-right">Costo Real</TableHead>
              <TableHead>Observación</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsBuyed.map((purchase, index) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    #{purchase.shopping_receip?.id || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {purchase.buy_date
                    ? new Date(purchase.buy_date).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {purchase.amount_buyed}
                </TableCell>
                
                <TableCell className="text-right text-green-600">
                  -${purchase.shop_discount?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  -${purchase.offer_discount?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {purchase.observation || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(purchase.id as number)}
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
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer
              y afectará las estadísticas del producto.
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

export default ProductPurchaseList;
