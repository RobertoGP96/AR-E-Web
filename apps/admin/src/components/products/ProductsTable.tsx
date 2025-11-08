import * as React from "react";
import { useState, useMemo } from 'react';
// no local state for visible columns; controlled by parent
import type { Product } from "../../types/models/product";
import type { VisibleColumn } from './ProductsColumnsSelector';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Edit2, Trash2, ExternalLink, MoreHorizontal, Loader2, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseTagsFromDescriptionBlock } from '@/lib/tags';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteProduct } from '@/hooks/product/useDeleteProduct';
import { toast } from 'sonner';
import { Link } from "react-router-dom";
import QRLink from "./qr-link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onGoToOrder?: (product: Product) => void;
  isLoading?: boolean;
  visibleColumns?: VisibleColumn[];
  itemsPerPage?: number;
}

// Función helper para obtener el color del badge según el estado
const getStatusBadgeVariant = (status: string) => {
  const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "Encargado": "default",
    "Comprado": "secondary",
    "Completado": "outline",
    "Cancelado": "destructive",
  };
  return statusMap[status] || "default";
};

// ...existing code...

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onEdit,
  onViewDetails,
  onGoToOrder,
  isLoading = false,
  visibleColumns: visibleColumnsProp,
  itemsPerPage = 10,
}) => {
  const defaultCols: VisibleColumn[] = ['name', 'category', 'status', 'total_cost', 'actions'];
  const visibleColumns = (visibleColumnsProp ?? defaultCols) as VisibleColumn[];

  const [dialogState, setDialogState] = useState<{ type: 'delete' | null; product: Product | null }>({ type: null, product: null });

  const deleteMutation = useDeleteProduct();
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular productos paginados
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Resetear a la primera página cuando cambian los productos
  React.useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5; // Número de páginas a mostrar

    if (totalPages <= showPages) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
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
    if (!dialogState.product) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(dialogState.product.id);
      toast.success('Producto eliminado');
    } catch (err) {
      console.error('Error deleting product', err);
      toast.error('No se pudo eliminar el producto');
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, product: null });
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, product: null });

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <Box className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay productos</h3>
          <p className="text-sm text-gray-500">
            Comienza creando añadiendo algun producto a un pedido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-muted bg-background shadow flex flex-col h-[calc(90vh-16rem)]">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {visibleColumns.includes('index') && <TableHead className="w-12">#</TableHead>}
                {visibleColumns.includes('sku') && <TableHead>SKU</TableHead>}
                {visibleColumns.includes('name') && <TableHead>Nombre</TableHead>}
                {visibleColumns.includes('shop') && <TableHead>Tienda</TableHead>}
                {visibleColumns.includes('category') && <TableHead>Categoría</TableHead>}
                {visibleColumns.includes('amount_requested') && <TableHead className="text-center">Solicitado</TableHead>}
                {visibleColumns.includes('amount_purchased') && <TableHead className="text-center">Comprado</TableHead>}
                {visibleColumns.includes('amount_delivered') && <TableHead className="text-center">Entregado</TableHead>}
                {visibleColumns.includes('status') && <TableHead className="text-center">Estado</TableHead>}
                {visibleColumns.includes('total_cost') && <TableHead className="text-right">Costo Total</TableHead>}
                {visibleColumns.includes('actions') && <TableHead className="text-center">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product, idx) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                  {visibleColumns.includes('index') && <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>}
                  {visibleColumns.includes('sku') && <TableCell className="font-mono text-sm">{product.sku}</TableCell>}
                  {visibleColumns.includes('name') && (
                    <TableCell className="flex flex-row items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{product.name}</span>
                        <QRLink link={product.link || 'https://arye-shipps.netlify.app'} />
                        {visibleColumns.includes('link') && product.link && (
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver producto en tienda"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {/* Mostrar tags como badges en formato Badge(name:value) debajo de la descripción */}
                      {(() => {
                        const description = product.description as string | undefined;
                        const tags = parseTagsFromDescriptionBlock(description);
                        if (!tags || tags.length === 0) return null;
                        return (
                          <div className=" flex flex-row flex-wrap items-start gap-1">
                            {tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag.name}{tag.value ? `: ${tag.value}` : ''}
                              </Badge>
                            ))}
                          </div>
                        );
                      })()}
                    </TableCell>
                  )}
                  {visibleColumns.includes('shop') && (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.shop || "N/A"}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes('category') && (
                    <TableCell>
                      {product.category ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin categoría</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.includes('amount_requested') && <TableCell className="text-center">{product.amount_requested}</TableCell>}
                  {visibleColumns.includes('amount_purchased') && (
                    <TableCell className="text-center">
                      <span className={product.is_fully_purchased ? "font-semibold text-green-600" : ""}>
                        {product.amount_purchased}
                      </span>
                      {product.pending_purchase > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (pendiente: {product.pending_purchase})
                        </span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.includes('amount_delivered') && (
                    <TableCell className="text-center">
                      <span className={product.is_fully_delivered ? "font-semibold text-green-600" : ""}>
                        {product.amount_delivered}
                      </span>
                      {product.pending_delivery > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (pendiente: {product.pending_delivery})
                        </span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.includes('total_cost') && (
                    <TableCell className="text-right font-semibold">
                      ${product.total_cost.toFixed(2)}
                    </TableCell>
                  )}
                  {visibleColumns.includes('actions') && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Dropdown con acciones: Ver detalles, Ir a pedido */}
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
                                onViewDetails?.(product);
                              }}
                              className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Link
                                to={`/products/${product.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="inline-flex items-center gap-2"
                                title={`Ir al producto ${product.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onGoToOrder?.(product);
                              }}
                              className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 rounded-lg"
                            >
                              <Link
                                to={`/orders/${typeof product.order === 'number' ? product.order : product.order?.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="inline-flex items-center gap-2"
                                title={`Ir al pedido ${typeof product.order === 'number' ? product.order : product.order?.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                Ir a pedido
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                // Alias: Edit desde menú
                                onEdit?.(product);
                              }}
                              className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!product || !product.id) {
                                  console.error('Producto sin ID válido', product);
                                  return;
                                }
                                setDialogState({ type: 'delete', product });
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>


        </div>


        <AlertDialog open={dialogState.type === 'delete' || isDeleting} onOpenChange={(open) => {
          // Prevent closing while deleting
          if (!open && isDeleting) return;
          if (!open) handleDeleteCancel();
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas eliminar el producto {dialogState.product ? `#${dialogState.product.id} - ${dialogState.product.name}` : ''}? Esta acción no se puede deshacer.
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

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
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

    </>
  );
};

export default ProductsTable;
