'use client';

import { useState, useTransition } from 'react';
import { Undo2 } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { AppModal, Field, TextArea, TextInput } from '@/components/ui';
import { refundBuyedProductAction } from '../actions';

export interface RefundableRow {
  id: string;
  productName: string;
  amountBuyed: number;
  quantityRefuned: number;
  refundNotes: string | null;
}

/**
 * Registra un reembolso ADICIONAL sobre una fila comprada: las
 * cantidades y montos se acumulan en el servidor y las notas se apilan
 * con fecha.
 */
export function RefundDialog({
  purchaseId,
  row,
  onClose,
  onSuccess,
}: {
  purchaseId: string;
  row: RefundableRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const refundable = row
    ? Math.max(0, row.amountBuyed - row.quantityRefuned)
    : 0;
  const [quantity, setQuantity] = useState(Math.min(1, refundable));
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const signature = row?.id ?? 'none';
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setQuantity(
      Math.min(1, row ? Math.max(0, row.amountBuyed - row.quantityRefuned) : 0)
    );
    setAmount(0);
    setNotes('');
  }

  function submit() {
    if (!row) return;
    startTransition(async () => {
      const result = await refundBuyedProductAction(
        purchaseId,
        row.id,
        quantity,
        amount,
        notes
      );
      if (result.ok) onSuccess();
      else
        toast.error('No se pudo registrar el reembolso', {
          description: result.error,
        });
    });
  }

  return (
    <AppModal
      isOpen={row !== null}
      onClose={onClose}
      title="Registrar reembolso"
      description={
        row
          ? `${row.productName} — ${row.amountBuyed} comprado(s)${
              row.quantityRefuned > 0
                ? `, ${row.quantityRefuned} ya reembolsado(s)`
                : ''
            }.`
          : undefined
      }
      icon={<Undo2 className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <div key={row?.id ?? 'none'} className="space-y-4">
        <Field
          label="Cantidad a reembolsar"
          hint={`Máximo ${refundable}`}
          required
        >
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            max={refundable}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(refundable, Math.floor(Number(e.target.value) || 1))
                )
              )
            }
          />
        </Field>

        <Field label="Monto del reembolso">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <TextInput
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="pl-7"
            />
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <TextArea
            rows={2}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {row?.refundNotes ? (
          <p className="whitespace-pre-line rounded-lg bg-default px-3 py-2 text-xs text-muted">
            {row.refundNotes}
          </p>
        ) : null}

        <div className="rounded-xl border border-danger/25 bg-danger-soft/40 p-3 text-sm">
          <div className="flex items-center justify-between font-semibold text-danger-soft-foreground">
            <span>Se reembolsarán {quantity} unidad(es)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            El reembolso reduce la cantidad comprada del producto y puede
            cambiar su estado. No se puede reembolsar mercancía ya recibida.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onPress={submit}
            isDisabled={isPending || refundable === 0}
          >
            {isPending ? (
              <>
                <Spinner size="sm" aria-hidden />
                Guardando…
              </>
            ) : (
              'Registrar reembolso'
            )}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
