import { Edit, Trash2, MoreHorizontal, Eye, Calendar, DollarSign, Receipt, BaggageClaim, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Invoice } from '@/types/models/invoice';
import { invoiceUtils } from '@/types/models/invoice';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useDeleteInvoice } from '@/hooks/invoice';
import { toast } from 'sonner';
import { useState } from 'react';
import LoadingSpinner from '../utils/LoadingSpinner';

interface InvoicesTableProps {
  invoices?: Invoice[];
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
  onInvoiceClick?: (invoice: Invoice) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Tipos para el diálogo de confirmación
type DialogType = 'delete' | null;

interface DialogState {
  type: DialogType;
  invoice: Invoice | null;
}

export default function InvoicesTable({
  invoices = [],
  onEditInvoice,
  onDeleteInvoice,
  onInvoiceClick,
  isLoading = false,
  error = null,
}: InvoicesTableProps) {
  // Estados para los diálogos de confirmación
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    invoice: null
  });

  // Hook para eliminar invoice
  const deleteInvoiceMutation = useDeleteInvoice();

  // Manejadores de acciones
  const handleDelete = async () => {
    if (!dialogState.invoice) return;

    try {
      await deleteInvoiceMutation.mutateAsync(dialogState.invoice.id);
      toast.success('Factura eliminada correctamente');
      onDeleteInvoice?.(dialogState.invoice);
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      toast.error('Error al eliminar la factura');
    } finally {
      setDialogState({ type: null, invoice: null });
    }
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setDialogState({ type: 'delete', invoice });
  };

  const closeDialog = () => {
    setDialogState({ type: null, invoice: null });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CircleAlert className="h-12 w-12 text-gray-400 mb-4" />
        <div className="text-center">
          <p className="text-red-600">Error al cargar costos: {error}</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-muted bg-background shadow">
        <div className="text-center">
          <BaggageClaim className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay costos registradas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-muted bg-background shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Conceptos</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onInvoiceClick?.(invoice)}
              >
                <TableCell className="font-medium">#{invoice.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {invoiceUtils.formatDate(invoice.date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600">
                      {invoiceUtils.formatTotal(invoice.total)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.tags && invoice.tags.length > 0 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-6 p-0" onClick={(e) => e.stopPropagation()}>
                          <Badge variant="secondary" className="cursor-pointer py-1">
                            <Receipt className="h-4 w-4 mr-1" />
                            {invoice.tags.length}
                          </Badge>
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="!w-auto p-3">
                        <div className="flex flex-col gap-2 max-w-[280px]">
                          {invoice.tags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  {tag.type === 'pesaje' ? 'Pesaje' : 'Nominal'}
                                </Badge>
                                {tag.type === 'pesaje' && (
                                  <div className="text-sm text-gray-500">
                                    {tag.type === 'pesaje' ? `${tag.weight} lb x $${tag.cost_per_lb}` : `$${tag.fixed_cost}`}
                                  </div>
                                )}
                              </div>

                              <div className="text-sm text-gray-800 font-bold">
                                {invoiceUtils.formatTotal(tag.subtotal)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Badge variant="outline">Sin tags</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {invoiceUtils.formatDateTime(invoice.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onInvoiceClick?.(invoice)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditInvoice?.(invoice)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(invoice)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={dialogState.type === 'delete'} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la factura
              #{dialogState.invoice?.id} con total de {dialogState.invoice ? invoiceUtils.formatTotal(dialogState.invoice.total) : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteInvoiceMutation.isPending}
            >
              {deleteInvoiceMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
