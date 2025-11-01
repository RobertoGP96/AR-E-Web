
import DeliveryStatusBadge from './DeliveryStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { DeliverReceip, DeliveryStatus } from '@/types';
import { Camera, Clock, Edit2, Trash2, MoreHorizontal, ExternalLink, Loader2, Truck, RotateCcw, Weight } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useDeleteDelivery } from '@/hooks/delivery/useDeleteDelivery';
import { useUpdateDeliveryStatus } from '@/hooks/delivery/useUpdateDelivery';
import { toast } from 'sonner';
import AvatarUser from '../utils/AvatarUser';

interface DeliveryTableProps {
  deliveries: DeliverReceip[];
  isLoading?: boolean;
  onEdit?: (delivery: DeliverReceip) => void;
  onDelete?: (delivery: DeliverReceip) => void;
  onCapture?: (delivery: DeliverReceip) => void;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({ 
  deliveries, 
  isLoading = false,
  onEdit,
  onDelete,
  onCapture,
}) => {
  const [dialogState, setDialogState] = useState<{ type: 'delete' | null; delivery: DeliverReceip | null }>({ type: null, delivery: null });

  const deleteDeliveryMutation = useDeleteDelivery();
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatusMutation = useUpdateDeliveryStatus();

  const handleDeleteConfirm = async () => {
    if (!dialogState.delivery) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(dialogState.delivery);
      } else {
        await deleteDeliveryMutation.mutateAsync(dialogState.delivery.id);
        toast.success(`Delivery #${dialogState.delivery.id} eliminado`);
      }
    } catch (err) {
      console.error('Error al eliminar delivery:', err);
      toast.error('Error al eliminar el delivery');
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, delivery: null });
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, delivery: null });

  const handleStatusChange = async (delivery: DeliverReceip) => {
    let newStatus: string | null = null;
    if (delivery.status === 'Pendiente') {
      newStatus = 'En transito';
    } else if (delivery.status === 'En transito') {
      newStatus = 'Entregado';
    }

    if (!newStatus) {
      toast.error('No se puede cambiar el estado de este delivery');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({ id: delivery.id, status: newStatus });
      toast.success(`Estado del delivery #${delivery.id} cambiado a ${newStatus}`);
    } catch (err) {
      console.error('Error al cambiar estado del delivery:', err);
      toast.error('Error al cambiar el estado del delivery');
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <Truck className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay deliveries</h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo delivery usando el botón "Agregar Delivery"
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
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Llegada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Captura</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery, index) => (
            <TableRow key={delivery.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {delivery.order ? (
                  <div className='flex flex-row items-center'>
                    <span className='rounded-full bg-gray-200 px-2  py-1 text-xs font-medium'>
                      {"#" + delivery.order.id}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm italic">Sin orden</span>
                )}
              </TableCell>
              <TableCell>
                {delivery.order?.client ? (
                  <AvatarUser user={delivery.order.client} />
                ) : (
                  <span className="text-gray-400 text-sm italic">Sin cliente</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex flex-row items-center text-gray-500'>
                  <Weight className="mr-2 inline h-4 w-4" />
                  <span>
                    {delivery.weight + " Lb"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {"$ " + delivery.total_cost_of_deliver.toFixed(2)}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex flex-row items-center text-gray-500'>
                  <Clock className="mr-2 inline h-4 w-4" />
                  {formatDate(delivery.deliver_date)}
                </div>
              </TableCell>
              <TableCell>
                <DeliveryStatusBadge status={delivery.status as DeliveryStatus} />
              </TableCell>
              <TableCell>
                <div className='flex flex-row gap-2'>
                  <Button 
                    className=' text-gray-600 cursor-pointer bg-gray-200'
                    onClick={() => onCapture?.(delivery)}
                  >
                    <Camera className='h-5 w-5' />
                  </Button>
                </div>
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
                          onEdit?.(delivery);
                        }}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onCapture?.(delivery);
                        }}
                        className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 rounded-lg"
                      >
                        <Camera className="h-4 w-4" />
                        Capturar
                      </DropdownMenuItem>

                      {(delivery.status === 'Pendiente' || delivery.status === 'En transito') && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(delivery);
                          }}
                          className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Cambiar Estado
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                      >
                        <Link
                          to={`/deliveries/${delivery.id}`}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                          }}
                          className="inline-flex items-center gap-2"
                          title={`Ver detalles del delivery ${delivery.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver detalles
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!delivery || !delivery.id) {
                            console.error('Error: Delivery sin ID válido', delivery);
                            return;
                          }

                          setDialogState({ type: 'delete', delivery });
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
      {/* Diálogo de confirmación para eliminar delivery */}
      <AlertDialog open={dialogState.type === 'delete' || isDeleting} onOpenChange={(open) => {
        // Prevent closing while deleting
        if (!open && isDeleting) return;
        if (!open) handleDeleteCancel();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el delivery {dialogState.delivery ? `#${dialogState.delivery.id}` : ''}? Esta acción no se puede deshacer.
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

export default DeliveryTable;