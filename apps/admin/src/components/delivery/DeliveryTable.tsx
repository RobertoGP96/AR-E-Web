import DeliveryStatusBadge from './DeliveryStatusBadge';
import EditDeliveryDialog from './EditDeliveryDialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { DeliverReceip, DeliveryStatus } from '@/types';
import { Camera, Clock, Edit2, Trash2, MoreHorizontal, ExternalLink, Loader2, Truck, Package, CheckCircle2, Weight, Boxes, ImageOff, Image } from 'lucide-react';
import { formatDeliveryDate } from '@/lib/format-date';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import React, { useState, useMemo, useEffect } from 'react';
import { useDeleteDelivery } from '@/hooks/delivery/useDeleteDelivery';
import { useUpdateDeliveryStatus } from '@/hooks/delivery/useUpdateDelivery';
import { toast } from 'sonner';
import AvatarUser from '../utils/AvatarUser';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { QuickImageUpload } from '@/components/images/QuickImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUpdateDelivery } from '@/hooks/delivery/useUpdateDelivery';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';

interface DeliveryTableProps {
  deliveries: DeliverReceip[];
  isLoading?: boolean;
  onEdit?: (delivery: DeliverReceip) => void;
  onDelete?: (delivery: DeliverReceip) => void;
  onCapture?: (delivery: DeliverReceip) => void;
  itemsPerPage?: number;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({
  deliveries,
  isLoading = false,
  onEdit,
  onDelete,
  onCapture,
  itemsPerPage = 10,
}) => {
  const [dialogState, setDialogState] = useState<{ type: 'delete' | null; delivery: DeliverReceip | null }>({ type: null, delivery: null });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliverReceip | null>(null);

  // States for capture image dialog
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const [captureDelivery, setCaptureDelivery] = useState<DeliverReceip | null>(null);

  const deleteDeliveryMutation = useDeleteDelivery();
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatusMutation = useUpdateDeliveryStatus();

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular deliveries paginados
  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return deliveries.slice(startIndex, endIndex);
  }, [deliveries, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);

  // Resetear a la primera página cuando cambian los deliveries
  useEffect(() => {
    setCurrentPage(1);
  }, [deliveries.length]);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleDeleteConfirm = async () => {
    if (!dialogState.delivery || !dialogState.delivery.id) return;

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

  // Función para obtener el siguiente estado
  const getNextStatus = (currentStatus: DeliveryStatus): DeliveryStatus | null => {
    // Normalizar el estado actual
    const lower = currentStatus.toLowerCase();

    if (lower === 'pendiente') return 'En transito';
    if (lower === 'en transito' || lower === 'en tránsito') return 'Entregado';
    return null;
  };

  // Función para obtener el ícono del siguiente estado
  const getNextStatusIcon = (nextStatus: DeliveryStatus) => {
    if (nextStatus === 'En transito') return Truck;
    if (nextStatus === 'Entregado') return CheckCircle2;
    return Package;
  };

  // Función para obtener el color del siguiente estado
  const getNextStatusColor = (nextStatus: DeliveryStatus) => {
    if (nextStatus === 'En transito') return 'hover:bg-blue-50 hover:text-blue-600';
    if (nextStatus === 'Entregado') return 'hover:bg-green-50 hover:text-green-600';
    return 'hover:bg-purple-50 hover:text-purple-600';
  };

  const handleStatusChange = async (delivery: DeliverReceip) => {
    if (!delivery || !delivery.id) {
      toast.error('Delivery inválido');
      return;
    }

    const newStatus = getNextStatus(delivery.status);

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

  const updateDeliveryMutation = useUpdateDelivery();

  // Helper para validar si la imagen es válida (no vacía)
  const isValidImage = (image: unknown): boolean => {
    if (!image) return false;
    if (typeof image === 'string') return image.trim().length > 0;
    if (Array.isArray(image)) {
      return image.length > 0 && (typeof image[0] === 'string' ? image[0].trim().length > 0 : !!image[0]);
    }
    return false;
  };

  const handleCaptureUploaded = async (delivery: DeliverReceip, url: string) => {
    try {
      const newUrls = url;

      await updateDeliveryMutation.mutateAsync({ id: delivery.id, data: { id: delivery.id, deliver_picture: newUrls } });
      toast.success('Imagen de entrega añadida correctamente');
      setShowCaptureDialog(false);
      setCaptureDelivery(null);
    } catch (err) {
      console.error('Error actualizando imagen de la entrega:', err);
      toast.error('Error al guardar la imagen de la entrega');
    }
  };

  // Helper para obtener la URL de imagen del producto con tolerancia a tipos
  const getProductImageUrl = (product: { product_pictures?: unknown; image_url?: string } | null | undefined): string | undefined => {
    if (!product) return undefined;
    const pic = product.product_pictures as unknown;
    if (typeof pic === 'string' && pic) return pic;
    return product.image_url;
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
    <>
      <div className="rounded-lg border border-muted bg-background shadow flex flex-col h-[calc(92vh-16rem)]">
        <Table>
          <TableHeader className="bg-gray-100 ">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Llegada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Captura</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeliveries.map((delivery, index) => (
              <TableRow key={delivery.id}>
                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                <TableCell>
                  {delivery.client && typeof delivery.client === 'object' ? (
                    <AvatarUser user={delivery.client} />
                  ) : (
                    <span className="text-gray-400 text-sm italic">Sin cliente</span>
                  )}
                </TableCell>
                <TableCell>
                  {delivery.category ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{delivery.category.name}</span>
                      <span className="text-xs text-gray-500">
                        ${delivery.category.shipping_cost_per_pound}/lb
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Sin categoría</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex flex-row items-center text-gray-500'>
                    <Weight className="mr-2 inline h-4 w-4" />
                    <span>
                      {(delivery.weight || 0) + " Lb"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {"$ " + (delivery.weight_cost || 0).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-row items-center text-gray-500'>
                    <Clock className="mr-2 inline h-4 w-4" />
                    {delivery.deliver_date ? formatDeliveryDate(delivery.deliver_date) : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <DeliveryStatusBadge status={(delivery.status || 'Pendiente') as DeliveryStatus} />
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Package className=" h-4 w-4" />
                        {delivery.delivered_products?.length || 0}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm border-b pb-2">
                          Productos Entregados ({delivery.delivered_products?.length || 0})
                        </h4>
                        {delivery.delivered_products && delivery.delivered_products.length > 0 ? (
                          <ul className="space-y-2">
                            {delivery.delivered_products.map((product) => (
                              <li
                                key={product.id}
                                className="flex flex-row items-start gap-2 justify-between p-2 rounded-md hover:bg-gray-50 border border-gray-100"
                              >
                                <div className="flex items-center gap-3 ">
                                  {getProductImageUrl(product.original_product) ? (
                                    <div className="rounded-md overflow-hidden w-14 h-14 bg-muted border border-muted-foreground/10" title="Imagen del producto">
                                      <img
                                        src={getProductImageUrl(product.original_product) || ''}
                                        alt={product.original_product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="rounded-md w-14 h-14 bg-gray-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400">
                                      <ImageOff className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-start gap-1 pl-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {product.original_product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Cantidad: {product.amount_delivered}
                                  </p>

                                </div>
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                  x{product.amount_delivered}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No hay productos entregados</p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <div className='flex flex-row gap-2'>
                    {isValidImage(delivery.deliver_picture) ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className='flex justify-center items-center p-2 border border-gray-100 rounded-md bg-white hover:bg-gray-50 cursor-pointer'>
                            <Image className='h-5 w-5 text-gray-500' />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-32 h-32 flex items-center justify-center">
                          <img
                            src={((delivery.deliver_picture as string) || '')}
                            alt={`Entrega ${delivery.id}`}
                            className="h-25 w-25 object-cover rounded-md"
                          />
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <button
                        type="button"
                        className='text-gray-600 bg-white rounded-md p-1 border border-gray-100 hover:bg-gray-50'
                        onClick={() => {
                          setCaptureDelivery(delivery);
                          setShowCaptureDialog(true);
                        }}
                        title='Subir imagen de entrega'
                      >
                        <Camera className='h-5 w-5' />
                      </button>
                    )}
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
                            setSelectedDelivery(delivery);
                            setEditDialogOpen(true);
                            if (onEdit) {
                              onEdit(delivery);
                            }
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

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                        >
                          <Link
                            to={`/delivery/${delivery.id}/add-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Agregar productos al delivery ${delivery.id}`}
                          >
                            <Package className="h-4 w-4" />
                            Agregar Productos
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                        >
                          <Link
                            to={`/delivery/${delivery.id}/manage-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Gestionar productos de la compra ${delivery.id}`}
                          >
                            <Boxes className="h-4 w-4" />
                            Gestionar Productos
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        >
                          <Link
                            to={`/delivery/${delivery.id}/remove-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Eliminar productos del delivery ${delivery.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Productos
                          </Link>
                        </DropdownMenuItem>

                        {getNextStatus(delivery.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(delivery);
                              }}
                              className={`flex items-center gap-2 rounded-lg ${getNextStatusColor(getNextStatus(delivery.status)!)}`}
                            >
                              {(() => {
                                const nextStatus = getNextStatus(delivery.status)!;
                                const IconComponent = getNextStatusIcon(nextStatus);
                                return (
                                  <>
                                    <IconComponent className="h-4 w-4" />
                                    <span>Marcar como {nextStatus}</span>
                                  </>
                                );
                              })()}
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                        >
                          <Link
                            to={`/delivery/${delivery.id}`}
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
      </div>

      {/* Componente de paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {getPageNumbers().map((page, idx) => (
                <PaginationItem key={idx}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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

      {/* Diálogo para editar delivery */}
      <EditDeliveryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        delivery={selectedDelivery}
      />

      {/* Diálogo para ver/subir imagen de la entrega (captura) */}
      <Dialog open={showCaptureDialog} onOpenChange={(open) => { if (!open) { setShowCaptureDialog(false); setCaptureDelivery(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Imagen de la entrega {captureDelivery ? `- #${captureDelivery.id}` : ''}</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {captureDelivery ? (
              <QuickImageUpload
                entityType="deliveries"
                currentImage={captureDelivery?.deliver_picture && captureDelivery.deliver_picture ? (captureDelivery.deliver_picture as string) : undefined}
                onImageUploaded={(url: string) => handleCaptureUploaded(captureDelivery, url)}
                folder={undefined}
                label="Subir/Actualizar imagen de entrega"
              />
            ) : (
              <div className="p-4 text-sm text-gray-500">Entrega no seleccionada</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DeliveryTable;