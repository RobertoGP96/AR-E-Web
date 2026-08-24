'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@heroui/react';
import {
  createDeliveryAction,
  updateDeliveryAction,
  type ActionResult,
} from './actions';
import { round2 } from '@/lib/order-cost';
import { formatCurrency } from '@/lib/format';
import { ImageUploadField } from '@/components/image-upload-field';
import {
  AppModal,
  Field,
  NativeSelect,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import {
  DELIVERY_STATUSES,
  type CategoryOption,
  type ClientOption,
  type DeliveryRow,
} from './schema';

interface DeliveryDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  delivery?: DeliveryRow;
  clientOptions: ClientOption[];
  categoryOptions: CategoryOption[];
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function DeliveryDialog({
  open,
  mode,
  delivery,
  clientOptions,
  categoryOptions,
  onClose,
  onSuccess,
}: DeliveryDialogProps) {
  const action =
    mode === 'create' ? createDeliveryAction : updateDeliveryAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  // Live weight-cost preview state.
  const [weight, setWeight] = useState(delivery?.weight ?? 0);
  const [categoryId, setCategoryId] = useState(delivery?.categoryId ?? '');

  const signature = `${open}-${mode}-${delivery?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setWeight(delivery?.weight ?? 0);
    setCategoryId(delivery?.categoryId ?? '');
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const cat = categoryOptions.find((c) => c.id === categoryId);
  const weightCostPreview = round2(weight * (cat?.clientShippingCharge ?? 0));

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva entrega' : 'Editar entrega'}
      description={
        mode === 'create'
          ? 'Registra una entrega de paquetes para un cliente.'
          : `Entrega #${delivery?.id ?? ''} de ${delivery?.clientName ?? ''}`
      }
      icon={<Truck className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (delivery?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && delivery ? (
          <input type="hidden" name="id" value={delivery.id} />
        ) : null}

        <Field label="Cliente" required error={errors['clientId']}>
          <NativeSelect
            name="clientId"
            defaultValue={delivery?.clientId ?? ''}
            required
            invalid={!!errors['clientId']}
          >
            <option value="">— Selecciona un cliente —</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Categoría (opcional)">
            <NativeSelect
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— Ninguna —</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} (${c.clientShippingCharge.toFixed(2)}/lb)
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Peso (lb)" error={errors['weight']}>
            <TextInput
              name="weight"
              type="number"
              step="0.01"
              min="0"
              value={Number.isFinite(weight) ? weight : 0}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              invalid={!!errors['weight']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Estado">
            <NativeSelect
              name="status"
              defaultValue={delivery?.status ?? 'Pendiente'}
            >
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Fecha de entrega" required error={errors['deliverDate']}>
            <TextInput
              name="deliverDate"
              type="date"
              required
              defaultValue={isoToDateInput(delivery?.deliverDate)}
              invalid={!!errors['deliverDate']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Monto pagado" error={errors['paymentAmount']}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={delivery?.paymentAmount.toString() ?? '0'}
                invalid={!!errors['paymentAmount']}
                className="pl-7"
              />
            </div>
          </Field>
          <Field label="Saldo aplicado" error={errors['balanceApplied']}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="balanceApplied"
                type="number"
                step="0.01"
                min="0"
                defaultValue={delivery?.balanceApplied.toString() ?? '0'}
                invalid={!!errors['balanceApplied']}
                className="pl-7"
              />
            </div>
          </Field>
        </div>

        <ImageUploadField
          name="deliverPicture"
          label="Foto de la entrega (opcional)"
          defaultUrl={delivery?.deliverPicture}
        />

        <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
            <span>Peso</span>
            <span className="text-right tabular-nums">
              {weight.toFixed(2)} lb
            </span>
            <span>Tarifa de la categoría</span>
            <span className="text-right tabular-nums">
              {formatCurrency(cat?.clientShippingCharge ?? 0)}/lb
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-accent/20 pt-2 text-sm font-bold text-foreground">
            <span>Costo por peso</span>
            <span className="tabular-nums">
              {formatCurrency(weightCostPreview)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            El costo por peso y la ganancia del gestor se recalculan en el
            servidor con la tarifa de la categoría y el agente asignado al
            cliente.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <SubmitButton isPending={isPending}>Guardar</SubmitButton>
        </div>
      </form>
    </AppModal>
  );
}
