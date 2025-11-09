
import * as React from "react";
import { StatusBadge } from "./StatusBadge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Box, Edit2, Trash2, ShoppingBag, Loader2, MoreHorizontal, CheckCircle, ExternalLink, CalendarIcon, ShoppingCart } from "lucide-react";
import { useShoppingReceipts } from "@/hooks/shopping-receipts/useShoppingReceipts";
import { useState, useMemo, useEffect } from 'react';
import { useDeleteShoppingReceipt } from "@/hooks/shopping-receipts/useDeleteShoppingReceipt";
import { useUpdateShoppingReceipt } from "@/hooks/shopping-receipts/useUpdateShoppingReceipt";
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditPurchaseForm } from './EditPurchaseForm';
import type { ShoppingReceip } from '@/types';
import { formatDayMonth } from "@/lib/format-date";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PurshasesTableProps {
    onDelete?: (receipt: ShoppingReceip) => void;
    itemsPerPage?: number;
}

const PurshasesTable: React.FC<PurshasesTableProps> = ({ onDelete, itemsPerPage = 10 }) => {
    const { shoppingReceipts, isLoading, error } = useShoppingReceipts();
    const [dialogState, setDialogState] = useState<{ type: 'delete' | 'edit' | null; receipt: ShoppingReceip | null }>({ type: null, receipt: null });
    const deleteReceiptMutation = useDeleteShoppingReceipt();
    const updateReceiptMutation = useUpdateShoppingReceipt();
    const [isDeleting, setIsDeleting] = useState(false);

    // Estado de paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Calcular receipts paginados
    const paginatedReceipts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return shoppingReceipts.slice(startIndex, endIndex);
    }, [shoppingReceipts, currentPage, itemsPerPage]);

    // Calcular total de páginas
    const totalPages = Math.ceil(shoppingReceipts.length / itemsPerPage);

    // Resetear a la primera página cuando cambian los receipts
    useEffect(() => {
        setCurrentPage(1);
    }, [shoppingReceipts.length]);

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
        if (!dialogState.receipt) return;

        setIsDeleting(true);
        try {
            if (onDelete) {
                await onDelete(dialogState.receipt);
            } else {
                await deleteReceiptMutation.mutateAsync(dialogState.receipt.id);
                toast.success(`Compra #${dialogState.receipt.id} eliminada`);
            }
        } catch (err) {
            console.error('Error al eliminar compra:', err);
            toast.error('Error al eliminar la compra');
        } finally {
            setIsDeleting(false);
            setDialogState({ type: null, receipt: null });
        }
    };

    const handleDeleteCancel = () => setDialogState({ type: null, receipt: null });

    const handleConfirmPayment = async (receipt: ShoppingReceip) => {
        try {
            await updateReceiptMutation.mutateAsync({
                id: receipt.id,
                data: { status_of_shopping: 'Pagado' }
            });
            toast.success(`Pago confirmado para la compra #${receipt.id}`);
        } catch (err) {
            console.error('Error al confirmar pago:', err);
            toast.error('Error al confirmar el pago');
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

    if (error) {
        return <div className="text-center py-4 text-red-500">Error al cargar las compras</div>;
    }

    if (!shoppingReceipts || shoppingReceipts.length === 0) {
        return (
            <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay compras</h3>
                    <p className="text-sm text-gray-500">
                        Comienza creando una nueva compra para ver los registros aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-lg border border-muted bg-background shadow flex flex-col h-[calc(90vh-20rem)]">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader className="bg-gray-100 ">
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tienda</TableHead>
                                <TableHead>Cuenta</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Costo Total</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedReceipts.map((purchase, index) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                    <TableCell>{"#00" + purchase.id}</TableCell>
                                    <TableCell>
                                        <div>
                                            <CalendarIcon className="h-5 w-5 inline-block mr-1 text-gray-500" />
                                            {formatDayMonth(purchase.buy_date)}
                                        </div>
                                    </TableCell>
                                    <TableCell>{purchase.shop_of_buy + ""}</TableCell>
                                    <TableCell>{purchase.shopping_account + ""}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-row text-gray-600 gap-1">
                                            <Box className="h-5 w-5" />
                                            <span className="">
                                                {purchase.buyed_products ? purchase.buyed_products.length : 0}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={purchase.status_of_shopping} />
                                    </TableCell>
                                    <TableCell>${purchase.total_cost_of_shopping.toFixed(2)}</TableCell>
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
                                                            handleConfirmPayment(purchase);
                                                        }}
                                                        className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Confirmar pago
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDialogState({ type: 'edit', receipt: purchase });
                                                        }}
                                                        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                                                    >
                                                        <Link
                                                            to={`/purchases/${purchase.id}`}
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="inline-flex items-center gap-2"
                                                            title={`Ver detalles de la compra ${purchase.id}`}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            Ver detalles
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                                                    >
                                                        <Link
                                                            to={`/purchases/${purchase.id}/manage-products`}
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="inline-flex items-center gap-2"
                                                            title={`Gestionar productos de la compra ${purchase.id}`}
                                                        >
                                                            <ShoppingCart className="h-4 w-4" />
                                                            Gestionar Productos
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDialogState({ type: 'delete', receipt: purchase });
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

            {/* Diálogo de confirmación para eliminar compra */}
            <AlertDialog open={dialogState.type === 'delete' || isDeleting} onOpenChange={(open) => {
                // Prevent closing while deleting
                if (!open && isDeleting) return;
                if (!open) handleDeleteCancel();
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar la compra {dialogState.receipt ? `#${dialogState.receipt.id}` : ''}? Esta acción no se puede deshacer.
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
            {/* Diálogo para editar compra */}
            <Dialog open={dialogState.type === 'edit'} onOpenChange={(open) => {
                if (!open) setDialogState({ type: null, receipt: null });
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Compra #{dialogState.receipt?.id}</DialogTitle>
                    </DialogHeader>
                    {dialogState.receipt && (
                        <EditPurchaseForm
                            receipt={dialogState.receipt}
                            onSuccess={() => setDialogState({ type: null, receipt: null })}
                            onCancel={() => setDialogState({ type: null, receipt: null })}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PurshasesTable;
