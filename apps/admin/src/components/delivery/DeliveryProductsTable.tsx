import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, Hash, ShoppingCart, Loader2, ImageIcon } from 'lucide-react';
import type { ProductDelivery, ID } from '@/types';
import { useState } from 'react';
import { useRemoveProductFromDelivery } from '@/hooks/delivery';
import { toast } from 'sonner';

interface DeliveryProductsTableProps {
  deliveryId: ID;
  products: ProductDelivery[];
}

export function DeliveryProductsTable({ deliveryId, products }: DeliveryProductsTableProps) {
  const [productToDelete, setProductToDelete] = useState<ProductDelivery | null>(null);
  const removeProductMutation = useRemoveProductFromDelivery();

  const handleRemoveProduct = async () => {
    if (!productToDelete) return;

    try {
      await removeProductMutation.mutateAsync({
        deliveryId,
        productDeliveryId: productToDelete.id,
      });
      toast.success('Producto removido del delivery');
      setProductToDelete(null);
    } catch (error) {
      console.error('Error al remover producto:', error);
      toast.error('Error al remover el producto');
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay productos en este delivery
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Agrega productos usando el botón "Agregar Producto" para incluirlos en este delivery
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Imagen</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Cantidad Entregada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((productDelivery, index) => (
              <TableRow key={productDelivery.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  {productDelivery.original_product.image_url ? (
                    <img
                      src={productDelivery.original_product.image_url}
                      alt={productDelivery.original_product.name}
                      className="h-12 w-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center border">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{productDelivery.original_product.name}</p>
                    {productDelivery.original_product.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {productDelivery.original_product.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-mono">
                      {productDelivery.original_product.sku}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">
                      {productDelivery.original_product.shop}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {productDelivery.amount_delivered} unidades
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setProductToDelete(productDelivery)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog 
        open={!!productToDelete} 
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover producto del delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas remover "{productToDelete?.original_product.name}" de este delivery?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeProductMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeProductMutation.isPending}
            >
              {removeProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removiendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
