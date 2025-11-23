import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import ExpensesFilters from '@/components/expenses/expenses-filters';
import ExpensesTable from '@/components/expenses/expenses-table';
import ExpenseForm from '@/components/expenses/expenses-form';
import type { CreateExpenseData, Expense, UpdateExpenseData, ExpenseFilters } from '@/types/models/expenses';
import { DEFAULT_PAGE_SIZE, formatCurrency } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteExpense } from '@/hooks/expense';
import { useExpenses, useCreateExpense, useUpdateExpense } from '@/hooks/expense';
import ExpensesHeader from '@/components/expenses/expenses-header';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el formulario de edición
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Estado para eliminar
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Construir filtros para la API
  type AllFilters = ExpenseFilters & import('@/types').BaseFilters;
  const apiFilters = useMemo(() => {
    const filters: Partial<AllFilters> = {};

    if (searchTerm) {
      filters.search = searchTerm;
    }

    // Añadir paginación
    filters.page = currentPage as number;
    filters.per_page = pageSize as number;
    return filters;
  }, [searchTerm, currentPage, pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Obtener expenses con el hook
  const { data, isLoading, error } = useExpenses(apiFilters);

  // Hooks para mutaciones
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // Manejador para crear expense
  const handleCreateExpense = async (expenseData: CreateExpenseData | UpdateExpenseData) => {
    try {
      await createExpenseMutation.mutateAsync(expenseData as CreateExpenseData);
      toast.success('Gasto creado correctamente');
    } catch (err) {
      console.error('Error al crear gasto:', err);
      toast.error('Error al crear el gasto');
    }
  };

  // Manejador para editar expense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditFormOpen(true);
  };

  // Manejador para eliminar expense (opcional: recibe la notificación)
  // Cuando el child solicita eliminación, se abre el diálogo en el padre
  const handleDeleteRequest = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpenseMutation.mutateAsync(expenseToDelete.id);
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
      toast.success('Gasto eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      toast.error('Error al eliminar el gasto');
    }
  };

  // Manejador para actualizar expense
  const handleUpdateExpense = async (expenseData: CreateExpenseData | UpdateExpenseData) => {
    try {
      await updateExpenseMutation.mutateAsync(expenseData as UpdateExpenseData);
      setIsEditFormOpen(false);
      setEditingExpense(null);
      toast.success('Gasto actualizado correctamente');
    } catch (err: unknown) {
      console.error('Error al actualizar gasto:', err);
      toast.error('Error al actualizar el gasto');
      // Re-lanzar el error para que no cierre el formulario
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <ExpensesHeader />

      {/* Métricas compactas de invoices - TODO: Implementar métricas específicas */}
      {/* <CompactMetricsSummary type="invoices" /> */}

      <ExpensesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateExpense={handleCreateExpense}
        isCreatingExpense={createExpenseMutation.isPending}
        resultCount={data?.results?.length}
      />

      <ExpensesTable
        expenses={data?.results}
        isLoading={isLoading}
        error={error ? String(error) : null}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteRequest}
        pagination={{
          current: currentPage,
          pageSize,
          total: data?.count,
          onChange: (page, newSize) => {
            setCurrentPage(page);
            setPageSize(newSize);
          }
        }}
      />

      {/* Formulario de edición */}
      <ExpenseForm
        mode="edit"
        expense={editingExpense ?? undefined}
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSubmit={handleUpdateExpense}
        loading={updateExpenseMutation.isPending}
      />

      {/* Dialogo de confirmación para eliminación (controlado en el padre) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => setIsDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el gasto #{expenseToDelete?.id} con monto de {expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteExpenseMutation.isPending}
            >
              {deleteExpenseMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;