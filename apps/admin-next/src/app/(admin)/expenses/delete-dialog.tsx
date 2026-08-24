'use client';

import { deleteExpenseAction } from './actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { ExpenseRow } from './schema';

interface DeleteExpenseDialogProps {
  expense: ExpenseRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteExpenseDialog({
  expense,
  onClose,
  onSuccess,
}: DeleteExpenseDialogProps) {
  return (
    <ConfirmModal
      isOpen={expense !== null}
      onClose={onClose}
      title="¿Eliminar gasto?"
      description={
        expense ? (
          <>
            Se eliminará el gasto de{' '}
            <strong className="text-foreground">
              {formatCurrency(expense.amount)}
            </strong>{' '}
            ({expense.category}) del {formatDate(expense.date)}. Esta acción no
            se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!expense) return { ok: false, error: 'Gasto no encontrado' };
        const result = await deleteExpenseAction(expense.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
