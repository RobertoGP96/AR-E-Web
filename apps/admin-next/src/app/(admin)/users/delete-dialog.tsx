'use client';

import { deleteUserAction } from './actions';
import { ConfirmModal } from '@/components/ui';
import type { UserRow } from './schema';

interface DeleteUserDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserDialog({
  user,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  return (
    <ConfirmModal
      isOpen={user !== null}
      onClose={onClose}
      title="¿Eliminar usuario?"
      description={
        user ? (
          <>
            Se eliminará a{' '}
            <strong className="text-foreground">
              {user.name} {user.lastName}
            </strong>{' '}
            ({user.phoneNumber}). La eliminación fallará si tiene órdenes,
            entregas o gastos vinculados — en ese caso, desactívalo. Esta
            acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!user) return { ok: false, error: 'Usuario no encontrado' };
        const result = await deleteUserAction(user.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
