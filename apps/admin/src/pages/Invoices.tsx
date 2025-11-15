import { InvoicesHeader, InvoicesFilters, InvoicesTable, InvoiceForm } from '@/components/invoices';
import { useState, useMemo } from 'react';
import { useInvoices, useCreateInvoice, useUpdateInvoice } from '@/hooks/invoice';
import type { Invoice, CreateInvoiceData, UpdateInvoiceData } from '@/types/models/invoice';
import { toast } from 'sonner';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el formulario de edición
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Construir filtros para la API
  const apiFilters = useMemo(() => {
    const filters: {
      search?: string;
    } = {};

    if (searchTerm) {
      filters.search = searchTerm;
    }

    return filters;
  }, [searchTerm]);

  // Obtener invoices con el hook
  const { data, isLoading, error } = useInvoices(apiFilters);

  // Hooks para mutaciones
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();

  // Manejador para crear invoice
  const handleCreateInvoice = async (invoiceData: CreateInvoiceData | UpdateInvoiceData) => {
    try {
      await createInvoiceMutation.mutateAsync(invoiceData as CreateInvoiceData);
      toast.success('Factura creada correctamente');
    } catch (err) {
      console.error('Error al crear factura:', err);
      toast.error('Error al crear la factura');
    }
  };

  // Manejador para editar invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditFormOpen(true);
  };

  // Manejador para actualizar invoice
  const handleUpdateInvoice = async (invoiceData: CreateInvoiceData | UpdateInvoiceData) => {
    try {
      await updateInvoiceMutation.mutateAsync(invoiceData as UpdateInvoiceData);
      setIsEditFormOpen(false);
      setEditingInvoice(null);
      toast.success('Factura actualizada correctamente');
    } catch (err: unknown) {
      console.error('Error al actualizar factura:', err);
      toast.error('Error al actualizar la factura');
      // Re-lanzar el error para que no cierre el formulario
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <InvoicesHeader />

      {/* Métricas compactas de invoices - TODO: Implementar métricas específicas */}
      {/* <CompactMetricsSummary type="invoices" /> */}

      <InvoicesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateInvoice={handleCreateInvoice}
        isCreatingInvoice={createInvoiceMutation.isPending}
        resultCount={data?.results?.length}
      />

      <InvoicesTable
        invoices={data?.results}
        isLoading={isLoading}
        error={error ? String(error) : null}
        onEditInvoice={handleEditInvoice}
      />

      {/* Formulario de edición */}
      <InvoiceForm
        mode="edit"
        invoice={editingInvoice ?? undefined}
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSubmit={handleUpdateInvoice}
        loading={updateInvoiceMutation.isPending}
      />
    </div>
  );
};

export default Invoices;