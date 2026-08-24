'use client';

import { deletePackageAction } from './actions';
import { ConfirmModal } from '@/components/ui';
import type { PackageRow } from './schema';

interface DeletePackageDialogProps {
  pkg: PackageRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePackageDialog({
  pkg,
  onClose,
  onSuccess,
}: DeletePackageDialogProps) {
  return (
    <ConfirmModal
      isOpen={pkg !== null}
      onClose={onClose}
      title="¿Eliminar paquete?"
      description={
        pkg ? (
          <>
            Se eliminará el paquete{' '}
            <strong className="font-mono text-foreground">
              {pkg.numberOfTracking}
            </strong>{' '}
            de {pkg.agencyName}. La eliminación fallará si aún tiene productos
            recibidos vinculados. Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!pkg) return { ok: false, error: 'Paquete no encontrado' };
        const result = await deletePackageAction(pkg.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
