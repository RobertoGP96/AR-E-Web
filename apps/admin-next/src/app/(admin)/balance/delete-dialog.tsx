'use client';

import { deleteBalanceAction } from './actions';
import { formatDate } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { BalanceRow } from './schema';

interface DeleteBalanceDialogProps {
  balance: BalanceRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteBalanceDialog({
  balance,
  onClose,
  onSuccess,
}: DeleteBalanceDialogProps) {
  return (
    <ConfirmModal
      isOpen={balance !== null}
      onClose={onClose}
      title="¿Eliminar balance?"
      description={
        balance ? (
          <>
            Se eliminará el balance del período{' '}
            <strong className="text-foreground">
              {formatDate(balance.startDate)} → {formatDate(balance.endDate)}
            </strong>
            . Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!balance) return { ok: false, error: 'Balance no encontrado' };
        const result = await deleteBalanceAction(balance.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
