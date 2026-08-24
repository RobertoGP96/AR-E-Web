'use client';

import { deleteInvoiceAction } from './actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { ConfirmModal } from '@/components/ui';
import type { InvoiceRow } from './schema';

interface DeleteInvoiceDialogProps {
  invoice: InvoiceRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteInvoiceDialog({
  invoice,
  onClose,
  onSuccess,
}: DeleteInvoiceDialogProps) {
  return (
    <ConfirmModal
      isOpen={invoice !== null}
      onClose={onClose}
      title="¿Eliminar factura?"
      description={
        invoice ? (
          <>
            Se eliminará la factura del{' '}
            <strong className="text-foreground">
              {formatDate(invoice.date)}
            </strong>{' '}
            ({formatCurrency(invoice.total)}) y sus {invoice.tags.length}{' '}
            concepto(s). Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      onConfirm={async () => {
        if (!invoice) return { ok: false, error: 'Factura no encontrada' };
        const result = await deleteInvoiceAction(invoice.id);
        if (result.ok) onSuccess();
        return result;
      }}
    />
  );
}
