
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
import { Button } from "../../ui/button";
import { Box, Edit2, Trash2, ShoppingBag, Loader2, MoreHorizontal, CheckCircle, ExternalLink, CalendarIcon } from "lucide-react";
import { useShoppingReceipts } from "@/hooks/shopping-receipts/useShoppingReceipts";
import { useState } from 'react';
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

interface PurshasesTableProps {
    onDelete?: (receipt: ShoppingReceip) => void;
}

const PurshasesTable: React.FC<PurshasesTableProps> = ({ onDelete }) => {
    const { shoppingReceipts, isLoading, error } = useShoppingReceipts();
    const [dialogState, setDialogState] = useState<{ type: 'delete' | 'edit' | null; receipt: ShoppingReceip | null }>({ type: null, receipt: null });
    const deleteReceiptMutation = useDeleteShoppingReceipt();
    const updateReceiptMutation = useUpdateShoppingReceipt();
    const [isDeleting, setIsDeleting] = useState(false);

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
            <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
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
                        {shoppingReceipts.map((purchase, index) => (
                            <TableRow key={purchase.id}>
                                <TableCell>{index + 1}</TableCell>
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
