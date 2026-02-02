import PackageStatusBadge from "./PackageStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { Package as PackageType } from "@/types";
import {
  Camera,
  Clock,
  Edit2,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  Package,
  CheckCircle2,
  Image,
} from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuickImageUpload } from "@/components/images/QuickImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { useState, useMemo, useEffect } from "react";
import { useDeletePackage } from "@/hooks/package/useDeletePackage";
import { useUpdatePackage, useUpdatePackageStatus } from "@/hooks/package";
import { toast } from "sonner";
import { TablePagination } from "../utils/TablePagination";
import LoadingSpinner from "../utils/LoadingSpinner";
import {
  ProductListPopover,
  useProductListAdapter,
} from "../utils/ProductListPopover";

interface PackagesTableProps {
  packages: PackageType[];
  isLoading?: boolean;
  onDelete?: (pkg: PackageType) => void;
  onCapture?: (pkg: PackageType) => void;
}

const PackagesTable: React.FC<PackagesTableProps> = ({
  packages,
  isLoading = false,
  onDelete,
  onCapture,
}) => {
  const navigate = useNavigate();
  const { adaptReceivedProducts } = useProductListAdapter();

  const [dialogState, setDialogState] = useState<{
    type: "delete" | null;
    pkg: PackageType | null;
  }>({ type: null, pkg: null });

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageDialogPackage, setImageDialogPackage] =
    useState<PackageType | null>(null);

  const deletePackageMutation = useDeletePackage();
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatusMutation = useUpdatePackageStatus();
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calcular packages paginados
  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return packages.slice(startIndex, endIndex);
  }, [packages, currentPage, itemsPerPage]);

  // Resetear a la primera página cuando cambien los packages o itemsPerPage
  useEffect(() => {
    setCurrentPage(1);
  }, [packages.length, itemsPerPage]);

  const updatePackageMutation = useUpdatePackage();

  const isValidImage = (image: unknown): boolean => {
    if (!image) return false;
    if (typeof image === "string") return image.trim().length > 0;
    if (Array.isArray(image)) {
      return (
        image.length > 0 &&
        (typeof image[0] === "string" ? image[0].trim().length > 0 : !!image[0])
      );
    }
    return false;
  };

  const handleImageUploaded = async (pkg: PackageType, url: string) => {
    try {
      await updatePackageMutation.mutateAsync({
        id: pkg.id,
        data: { package_picture: url },
      });
      toast.success("Imagen añadida correctamente");
      setShowImageDialog(false);
      setImageDialogPackage(null);
    } catch (err) {
      console.error("Error actualizando imagen del producto:", err);
      toast.error("Error al guardar la imagen");
    }
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
      console.error("Error al eliminar paquete:", err);
      toast.error("Error al eliminar el paquete");
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, pkg: null });
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, pkg: null });


  const getNextStatusIcon = (nextStatus: string) => {
    if (nextStatus === "Recibido") return Package;
    if (nextStatus === "Procesado") return CheckCircle2;
    return Package;
  };

  const getNextStatusColor = (nextStatus: string) => {
    if (nextStatus === "Recibido")
      return "hover:bg-yellow-50 hover:text-yellow-600";
    if (nextStatus === "Procesado")
      return "hover:bg-green-50 hover:text-green-600";
    return "hover:bg-purple-50 hover:text-purple-600";
  };

  const getNextStatusLabel = (nextStatus: string) => {
    const labels: Record<string, string> = {
      Recibido: "Recibir Paquete",
      Procesado: "Procesar Paquete",
    };
    return labels[nextStatus] || `Marcar como ${nextStatus}`;
  };

  const handleUpdatePackageStatus = async (pkg: PackageType, newStatus: string) => {
    if (!newStatus) {
      toast.error("El nuevo estado no es válido.");
      return;
    }

    setUpdatingStatusId(pkg.id);
    try {
      await updateStatusMutation.mutateAsync({ id: pkg.id, status: newStatus });

      const messages: Record<string, string> = {
        Recibido: `Paquete #${pkg.agency_name} marcado como Recibido`,
        Procesado: `Paquete #${pkg.agency_name} marcado como Procesado`,
      };

      toast.success(
        messages[newStatus] ||
        `Estado del paquete #${pkg.agency_name} cambiado a ${newStatus}`,
      );
    } catch (err) {
      console.error("Error al cambiar estado del paquete:", err);
      toast.error("Error al cambiar el estado del paquete");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const isStatusTransitionAllowed = (currentStatus: string, targetStatus: string): boolean => {
    const normalizedCurrent = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();
    const normalizedTarget = targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1).toLowerCase();

    if (normalizedCurrent === "Enviado" && normalizedTarget === "Recibido") return true;
    if (normalizedCurrent === "Recibido" && normalizedTarget === "Procesado") return true;
    return false;
  };

  const renderStatusUpdateMenuItem = (
    pkg: PackageType,
    targetStatus: "Recibido" | "Procesado",
  ) => {
    const isAvailable = isStatusTransitionAllowed(pkg.status_of_processing, targetStatus);
    const Icon = getNextStatusIcon(targetStatus);
    const label = getNextStatusLabel(targetStatus);
    const colorClass = getNextStatusColor(targetStatus);

    if (!isAvailable) return null;

    return (
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          handleUpdatePackageStatus(pkg, targetStatus);
        }}
        className={`flex items-center gap-2 rounded-lg ${colorClass}`}
        disabled={updatingStatusId === pkg.id}
      >
        {updatingStatusId === pkg.id ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {label}
      </DropdownMenuItem>
    );
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Cargando paquetes" />
        </div>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No hay paquetes
          </h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo paquete usando el botón "Nuevo Paquete"
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
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-row items-center">
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium">
                      {"#" + pkg.agency_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{pkg.number_of_tracking}</TableCell>
                <TableCell>
                  <div className="flex flex-row items-center text-gray-500">
                    <Clock className="mr-2 inline h-4 w-4" />
                    {formatDate(pkg.arrival_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <PackageStatusBadge status={pkg.status_of_processing} />
                </TableCell>
                <TableCell>
                  <ProductListPopover
                    products={adaptReceivedProducts(
                      pkg.contained_products || [],
                    )}
                    title="Productos Recibidos"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-row gap-2">
                    {isValidImage(pkg.package_picture) ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="flex justify-center items-center p-2 border border-gray-100 rounded-md bg-white hover:bg-gray-50 cursor-pointer">
                            <Image className="h-5 w-5 text-gray-500" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-32 h-32 flex items-center justify-center">
                          <img
                            src={(() => {
                              const pic = pkg.package_picture;
                              if (!pic) return "";
                              if (Array.isArray(pic)) {
                                const first = pic[0];
                                return (
                                  (typeof first === "string"
                                    ? first
                                    : first?.picture) || ""
                                );
                              }
                              return typeof pic === "string" ? pic : "";
                            })()}
                            alt={`Entrega ${pkg.id}`}
                            className="h-25 w-30 object-cover rounded-md"
                          />
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <button
                        type="button"
                        className="text-gray-600 bg-white rounded-md p-1 border border-gray-100 hover:bg-gray-50"
                        onClick={() => {
                          setImageDialogPackage(pkg);
                          setShowImageDialog(true);
                        }}
                        title="Subir imagen de paquete"
                      >
                        <Camera className="h-5 w-5" />
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
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl shadow-xl border-gray-200"
                      >
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
                            className="inline-flex items-center gap-2 w-full"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/packages/${pkg.id}/edit`);
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

                        <DropdownMenuSeparator />

                        {renderStatusUpdateMenuItem(pkg, "Recibido")}
                        {renderStatusUpdateMenuItem(pkg, "Procesado")}
                        <DropdownMenuSeparator />



                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogState({ type: "delete", pkg });
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

      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(packages.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={packages.length}
      />

      <AlertDialog
        open={dialogState.type === "delete" || isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) handleDeleteCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el paquete{" "}
              {dialogState.pkg ? `#${dialogState.pkg.agency_name}` : ""}? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
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
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={showImageDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowImageDialog(false);
            setImageDialogPackage(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Imágenes del paquete{" "}
              {imageDialogPackage ? `- ${imageDialogPackage.agency_name}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {imageDialogPackage ? (
              <QuickImageUpload
                entityType="products"
                currentImage={(() => {
                  const pic = imageDialogPackage.package_picture;
                  if (!pic) return undefined;
                  if (Array.isArray(pic)) {
                    const first = pic[0];
                    return typeof first === "string" ? first : first?.picture;
                  }
                  return typeof pic === "string" ? pic : undefined;
                })()}
                onImageUploaded={(url: string) =>
                  handleImageUploaded(imageDialogPackage, url)
                }
                folder={undefined}
              />
            ) : (
              <div className="p-4 text-sm text-gray-500">
                Producto no seleccionado
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PackagesTable;
