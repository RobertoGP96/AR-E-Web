import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CategoriesHeader, CategoriesFilters, CategoriesTable } from '@/components/categories';
import CategoryDialog from '@/components/categories/CategoryDialog';
import DeleteDialog from '@/components/shops/DeleteDialog';
import { useCategories, useDeleteCategory, useCreateCategory, useUpdateCategory, useSearchCategories } from '@/hooks/category/useCategory';
import type { Category } from '@/types/models/category';

export default function Categories() {
  const [searchValue, setSearchValue] = useState('');

  const { data, isLoading } = useCategories();
  const searchQuery = useSearchCategories(searchValue);

  const categories: Category[] = useMemo(() => {
    if (searchValue && searchQuery.data?.results) return searchQuery.data.results;
    return data?.results ?? [];
  }, [data, searchQuery.data, searchValue]);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Helper para obtener estado de carga compatible con distintas versiones de react-query
  const getMutationLoading = (mutation: unknown): boolean => {
    if (!mutation || typeof mutation !== 'object') return false;
    const m = mutation as Record<string, unknown>;
    if (typeof m.isLoading === 'boolean') return m.isLoading;
    if (typeof m.isPending === 'boolean') return m.isPending;
    return false;
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      toast.success('Categoría eliminada');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? (err as Record<string, unknown>)['message'] : 'Error eliminando categoría';
      toast.error(message as string);
    }
  };

  const handleSave = async (payload: { name: string; shipping_cost_per_pound: number; client_shipping_charge: number; id?: number }) => {
    if (payload.id) {
      try {
        await updateMutation.mutateAsync({ 
          id: payload.id, 
          data: { 
            name: payload.name, 
            shipping_cost_per_pound: payload.shipping_cost_per_pound,
            client_shipping_charge: payload.client_shipping_charge
          } 
        });
        toast.success('Categoría actualizada');
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err ? (err as Record<string, unknown>)['message'] : 'Error actualizando categoría';
        toast.error(message as string);
      }
    } else {
      try {
        await createMutation.mutateAsync({ 
          name: payload.name, 
          shipping_cost_per_pound: payload.shipping_cost_per_pound,
          client_shipping_charge: payload.client_shipping_charge
        });
        toast.success('Categoría creada');
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err ? (err as Record<string, unknown>)['message'] : 'Error creando categoría';
        toast.error(message as string);
      }
    }
  };

  return (
    <div className="space-y-6">
      <CategoriesHeader />
      <CategoriesFilters searchValue={searchValue} onSearchChange={setSearchValue} onAdd={handleAdd} />
      <CategoriesTable categories={categories} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
        initialCategory={editingCategory ?? undefined}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => setDeleteDialogOpen(open)}
        title={categoryToDelete ? `Eliminar categoría "${categoryToDelete.name}"` : 'Eliminar categoría'}
        description={categoryToDelete ? `Esta acción eliminará la categoría ${categoryToDelete.name}. Esta operación no se puede deshacer.` : 'Esta acción eliminará la categoría seleccionada. Esta operación no se puede deshacer.'}
        onConfirm={confirmDelete}
        isLoading={getMutationLoading(deleteMutation)}
      />
    </div>
  );
}
