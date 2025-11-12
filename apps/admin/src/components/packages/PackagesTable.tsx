
import PackageStatusBadge from './PackageStatusBadge';
import EditPackageDialog from './EditPackageDialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Package as PackageType } from '@/types';
import { Camera, Clock, Edit2, Trash2, MoreHorizontal, ExternalLink, Loader2, Package, CheckCircle2, Box } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { useDeletePackage } from '@/hooks/package/useDeletePackage';
import { useUpdatePackageStatus } from '@/hooks/package';
import { toast } from 'sonner';
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

interface PackagesTableProps {
  packages: PackageType[];
  isLoading?: boolean;
  onEdit?: (pkg: PackageType) => void;
  onDelete?: (pkg: PackageType) => void;
  onCapture?: (pkg: PackageType) => void;
  itemsPerPage?: number;
}

const PackagesTable: React.FC<PackagesTableProps> = ({
  packages,
  isLoading = false,
  onEdit,
  onDelete,
  onCapture,
  itemsPerPage = 10,
}) => {
  const [dialogState, setDialogState] = useState<{ type: 'delete' | null; pkg: PackageType | null }>({ type: null, pkg: null });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);

  const deletePackageMutation = useDeletePackage();
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatusMutation = useUpdatePackageStatus();
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular packages paginados
  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return packages.slice(startIndex, endIndex);
  }, [packages, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(packages.length / itemsPerPage);

  // Resetear a la primera página cuando cambian los packages
  useEffect(() => {
    setCurrentPage(1);
  }, [packages.length]);

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
    if (!dialogState.pkg) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(dialogState.pkg);
      } else {
        await deletePackageMutation.mutateAsync(dialogState.pkg.id);
        toast.success(`Paquete #${dialogState.pkg.id} eliminado`);
      }
    } catch (err) {
      console.error('Error al eliminar paquete:', err);
      toast.error('Error al eliminar el paquete');
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, pkg: null });
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, pkg: null });

  // Función para obtener el siguiente estado del paquete
  const getNextStatus = (currentStatus: string): string | null => {
    // Normalizar el estado actual
    const normalized = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();

    if (normalized === 'Enviado') return 'Recibido';
    if (normalized === 'Recibido') return 'Procesado';
    return null;
  };

  // Función para obtener el ícono del siguiente estado
  const getNextStatusIcon = (nextStatus: string) => {
    if (nextStatus === 'Recibido') return Package;
    if (nextStatus === 'Procesado') return CheckCircle2;
    return Package;
  };

  // Función para obtener el color del siguiente estado
  const getNextStatusColor = (nextStatus: string) => {
    if (nextStatus === 'Recibido') return 'hover:bg-yellow-50 hover:text-yellow-600';
    if (nextStatus === 'Procesado') return 'hover:bg-green-50 hover:text-green-600';
    return 'hover:bg-purple-50 hover:text-purple-600';
  };

  // Función para obtener el label del siguiente estado
  const getNextStatusLabel = (nextStatus: string) => {
    const labels: Record<string, string> = {
      'Recibido': 'Recibir Paquete',
      'Procesado': 'Procesar Paquete',
    };
    return labels[nextStatus] || `Marcar como ${nextStatus}`;
  };

  const handleStatusChange = async (pkg: PackageType) => {
    const newStatus = getNextStatus(pkg.status_of_processing);

    if (!newStatus) {
      toast.error('No se puede cambiar el estado de este paquete');
      return;
    }

    setUpdatingStatusId(pkg.id);
    try {
      await updateStatusMutation.mutateAsync({ id: pkg.id, status: newStatus });

      // Mensaje personalizado según el nuevo estado
      const messages: Record<string, string> = {
        'Recibido': `Paquete #${pkg.agency_name} marcado como Recibido`,
        'Procesado': `Paquete #${pkg.agency_name} marcado como Procesado`,
      };

      toast.success(messages[newStatus] || `Estado del paquete #${pkg.agency_name} cambiado a ${newStatus}`);
    } catch (err) {
      console.error('Error al cambiar estado del paquete:', err);
      toast.error('Error al cambiar el estado del paquete');
    } finally {
      setUpdatingStatusId(null);
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

  if (!packages || packages.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay paquetes</h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo paquete usando el botón "Agregar Paquete"
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-muted bg-background shadow flex flex-col h-[calc(90vh-16rem)]">

        <Table>
          <TableHeader className="bg-gray-100 ">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>No. Rastreo</TableHead>
              <TableHead>Llegada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Captura</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPackages.map((pkg, index) => (
              <TableRow key={pkg.id}>
                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                <TableCell>
                  <div className='flex flex-row items-center'>
                    <span className='rounded-full bg-gray-200 px-2 py-1 text-xs font-medium'>
                      {"#" + pkg.agency_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{pkg.number_of_tracking}</TableCell>
                <TableCell>
                  <div className='flex flex-row items-center text-gray-500'>
                    <Clock className="mr-2 inline h-4 w-4" />
                    {formatDate(pkg.arrival_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <PackageStatusBadge status={pkg.status_of_processing} />
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
                        {pkg.contained_products?.length || 0}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm border-b pb-2">
                          Productos Recibidos ({pkg.contained_products?.length || 0})
                        </h4>
                        {pkg.contained_products && pkg.contained_products.length > 0 ? (
                          <ul className="space-y-2">
                            {pkg.contained_products.map((product) => (
                              <li
                                key={product.id}
                                className="flex items-start justify-between p-2 rounded-md hover:bg-gray-50 border border-gray-100"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {product.original_product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Cantidad: {product.amount_received}
                                  </p>
                                  {product.observation && (
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                      {product.observation}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                  x{product.amount_received}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No hay productos recibidos</p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <div className='flex flex-row gap-2'>
                    <Button
                      className='text-gray-600 cursor-pointer bg-gray-200 hover:bg-gray-300'
                      onClick={() => onCapture?.(pkg)}
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
                            setSelectedPackage(pkg);
                            setEditDialogOpen(true);
                            if (onEdit) {
                              onEdit(pkg);
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
                            onCapture?.(pkg);
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
                            to={`/packages/${pkg.id}/add-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Agregar productos al paquete ${pkg.agency_name}`}
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
                            to={`/packages/${pkg.id}/manage-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Gestionar productos del paquete ${pkg.agency_name}`}
                          >
                            <Box className="h-4 w-4" />
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
                            to={`/packages/${pkg.id}/remove-products`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Eliminar productos del paquete ${pkg.agency_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Productos
                          </Link>
                        </DropdownMenuItem>

                        {/* Cambio de estado en dropdown */}
                        {getNextStatus(pkg.status_of_processing) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(pkg);
                              }}
                              disabled={updatingStatusId === pkg.id}
                              className={`flex items-center gap-2 rounded-lg ${getNextStatusColor(getNextStatus(pkg.status_of_processing)!)}`}
                            >
                              {updatingStatusId === pkg.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Actualizando...</span>
                                </>
                              ) : (
                                (() => {
                                  const nextStatus = getNextStatus(pkg.status_of_processing)!;
                                  const IconComponent = getNextStatusIcon(nextStatus);
                                  const label = getNextStatusLabel(nextStatus);
                                  return (
                                    <>
                                      <IconComponent className="h-4 w-4" />
                                      <span>{label}</span>
                                    </>
                                  );
                                })()
                              )}
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
                            to={`/packages/${pkg.id}`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                            }}
                            className="inline-flex items-center gap-2"
                            title={`Ver detalles del paquete ${pkg.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();

                            if (!pkg || !pkg.id) {
                              console.error('Error: Paquete sin ID válido', pkg);
                              return;
                            }

                            setDialogState({ type: 'delete', pkg });
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

      {/* Diálogo de confirmación para eliminar paquete */}
      <AlertDialog open={dialogState.type === 'delete' || isDeleting} onOpenChange={(open) => {
        // Prevent closing while deleting
        if (!open && isDeleting) return;
        if (!open) handleDeleteCancel();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el paquete {dialogState.pkg ? `#${dialogState.pkg.agency_name}` : ''}? Esta acción no se puede deshacer.
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

      {/* Diálogo para editar paquete */}
      <EditPackageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        package={selectedPackage}
      />
    </>
  );
}

export default PackagesTable;