'use client';

import { useState, useTransition } from 'react';
import { Scale } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { round2 } from '@/lib/order-cost';
import { AppModal, Field, TextInput } from '@/components/ui';
import { correctDeliveryWeightAction, registerBagWeightAction } from './actions';

/**
 * Pesar una bolsa (la cierra) o corregir el peso de una entrega (admin).
 * Muestra el costo y la ganancia del gestor previstos (RN-002/RN-003).
 */
export function WeighDialog({
  open,
  mode,
  delivery,
  onClose,
}: {
  open: boolean;
  mode: 'close' | 'correct';
  delivery: {
    id: string;
    clientName: string;
    categoryName: string | null;
    weight: number;
    chargePerLb: number;
    agentProfit: number;
  };
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(mode === 'correct' && delivery.weight > 0 ? String(delivery.weight) : '');
  const weight = Number(text) || 0;
  const cost = round2(weight * delivery.chargePerLb);
  const profit = round2(weight * delivery.agentProfit);

  function submit() {
    if (weight <= 0) return;
    startTransition(async () => {
      const result =
        mode === 'close'
          ? await registerBagWeightAction(delivery.id, weight)
          : await correctDeliveryWeightAction(delivery.id, weight);
      if (result.ok) {
        toast.success(mode === 'close' ? 'Bolsa pesada y cerrada' : 'Peso corregido', {
          description: `${delivery.categoryName ?? 'Sin categoría'} · ${weight.toFixed(2)} lb → ${formatCurrency(cost)}.`,
        });
        onClose();
      } else {
        toast.error('No se pudo registrar el peso', { description: result.error });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'close' ? 'Pesar y cerrar la bolsa' : 'Corregir peso'}
      description={`Entrega #${delivery.id} de ${delivery.clientName}${
        delivery.categoryName ? ` · ${delivery.categoryName}` : ''
      }`}
      icon={<Scale className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <div className="space-y-4">
        <Field label="Peso (lb)" required>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-lg"
          />
        </Field>
        <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
            <span>Tarifa de la categoría</span>
            <span className="text-right tabular-nums">{formatCurrency(delivery.chargePerLb)}/lb</span>
            <span>Ganancia del gestor</span>
            <span className="text-right tabular-nums">{formatCurrency(profit)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-accent/20 pt-2 text-sm font-bold text-foreground">
            <span>Costo por peso</span>
            <span className="tabular-nums">{formatCurrency(cost)}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {mode === 'close'
              ? 'Al pesar, la bolsa se cierra: lo que llegue después de esta categoría abrirá otra bolsa.'
              : 'Se recalculan el costo, la ganancia del gestor, el estado de pago y el balance del cliente.'}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onPress={submit} isDisabled={isPending || weight <= 0} className="h-11 sm:h-auto">
            {isPending ? <Spinner size="sm" color="current" aria-hidden /> : <Scale className="h-4 w-4" aria-hidden />}
            {mode === 'close' ? 'Pesar y cerrar' : 'Guardar peso'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
