'use client';

import { deleteCategoryAction } from './actions';
import { ConfirmModal } from '@/components/ui';
import type { CategoryRow } from './schema';

interface DeleteCategoryDialogProps {
  category: CategoryRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({
  category,
  onClose,
  onSuccess,
}: DeleteCategoryDialogProps) {
  return (
    <ConfirmModal
      isOpen={category !== null}
      onClose={onClose}
      title="¿Eliminar categoría?"
      description={
        category ? (
          <>
            Se eliminará{' '}
            <strong className="text-foreground">{category.name}</strong>. Los
            productos y entregas que la referencian seguirán funcionando, pero
            dejarán de estar asociados a esta categoría.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!category) return { ok: false, error: 'Categoría no encontrada' };
        const result = await deleteCategoryAction(category.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
