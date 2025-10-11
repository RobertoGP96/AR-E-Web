import OrderStatusBadge from './OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, type Order, type OrderStatus, type PayStatus } from '@/types';
import { Edit2, ShoppingCart, Trash2, MoreHorizontal, CheckCircle, Plus, Loader2 } from 'lucide-react';
import AvatarUser from '../utils/AvatarUser';
import PayStatusBadge from '../utils/PayStatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useDeleteOrder } from '@/hooks/order/useDeleteOrder';
import { toast } from 'sonner';

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onConfirmPayment?: (order: Order) => void;
  onAddProducts?: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ 
  orders, 
  isLoading = false,
  onEdit,
  onDelete,
  onConfirmPayment,
  onAddProducts,
}) => {
  const [dialogState, setDialogState] = useState<{ type: 'delete' | null; order: Order | null }>({ type: null, order: null });

  const deleteOrderMutation = useDeleteOrder();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!dialogState.order) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(dialogState.order);
      } else {
        await deleteOrderMutation.mutateAsync(dialogState.order.id);
        toast.success(`Pedido #${dialogState.order.id} eliminado`);
      }
    } catch (err) {
      console.error('Error al eliminar pedido:', err);
      toast.error('Error al eliminar el pedido');
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, order: null });
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, order: null });
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pedidos</h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo pedido usando el botón "Agregar Pedido"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100 ">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
              <TableRow key={order.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className='flex flex-row items-center'>
                  <span className='rounded-full bg-gray-200 px-2  py-1 text-xs font-medium'>
                    {"#" + order.id}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {order.sales_manager ? (
                  <AvatarUser user={order.sales_manager} />
                ) : (
                  <span className="text-gray-400">Sin asignar</span>
                )}
              </TableCell>
              <TableCell>
                {order.client ? (
                  <AvatarUser user={order.client} />
                ) : (
                  <span className="text-gray-400">Sin cliente</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex flex-row items-center gap-0.5 text-gray-600'>
                  <ShoppingCart className='h-4 w-4'/>
                  <span>
                    {order.products?.length || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </TableCell>
              <TableCell>
                {formatCurrency(order.total_cost)}
              </TableCell>
              <TableCell>
                <PayStatusBadge status={order.pay_status as PayStatus} />
              </TableCell>

              <TableCell>
                <div className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-200">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();

                          // Evitar confirmar si ya está pagado
                          if (order.pay_status === 'Pagado') {
                            toast.info(`El pedido #${order.id} ya está marcado como Pagado`);
                            return;
                          }

                          onConfirmPayment?.(order);
                        }}
                        className={`flex items-center gap-2 rounded-lg ${order.pay_status === 'Pagado' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 hover:text-green-600'}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirmar pago
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(order);
                        }}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddProducts?.(order);
                        }}
                        className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir productos
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!order || !order.id) {
                            console.error('Error: Pedido sin ID válido', order);
                            return;
                          }

                          setDialogState({ type: 'delete', order });
                        }}
                        className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Diálogo de confirmación para eliminar pedido */}
      <AlertDialog open={dialogState.type === 'delete' || isDeleting} onOpenChange={(open) => {
        // Prevent closing while deleting
        if (!open && isDeleting) return;
        if (!open) handleDeleteCancel();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el pedido {dialogState.order ? `#${dialogState.order.id}` : ''}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
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
    </div>
  );
}

export default OrderTable;