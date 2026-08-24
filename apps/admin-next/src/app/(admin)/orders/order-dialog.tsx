'use client';

import { useActionState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@heroui/react';
import {
  createOrderAction,
  updateOrderAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  NativeSelect,
  TextInput,
  TextArea,
  SubmitButton,
} from '@/components/ui';
import { ORDER_STATUSES, type OrderRow, type SelectOption } from './schema';

interface OrderDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  order?: OrderRow;
  clientOptions: SelectOption[];
  managerOptions: SelectOption[];
  onClose: () => void;
  onSuccess: (newId?: string) => void;
}

export function OrderDialog({
  open,
  mode,
  order,
  clientOptions,
  managerOptions,
  onClose,
  onSuccess,
}: OrderDialogProps) {
  const action = mode === 'create' ? createOrderAction : updateOrderAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess(state.id);
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva orden' : 'Editar orden'}
      description={
        mode === 'create'
          ? 'Crea una orden para un cliente; los productos se añaden después.'
          : `Orden #${order?.id ?? ''} de ${order?.clientName ?? ''}`
      }
      icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (order?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && order ? (
          <input type="hidden" name="id" value={order.id} />
        ) : null}

        <Field label="Cliente" required error={errors['clientId']}>
          <NativeSelect
            name="clientId"
            defaultValue={order?.clientId ?? ''}
            required
            invalid={!!errors['clientId']}
          >
            <option value="">— Selecciona un cliente —</option>
            {clientOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Gestor de venta (opcional)">
          <NativeSelect
            name="salesManagerId"
            defaultValue={order?.salesManagerId ?? ''}
          >
            <option value="">— Ninguno —</option>
            {managerOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Estado">
          <NativeSelect name="status" defaultValue={order?.status ?? 'Encargado'}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Recibido del cliente"
            error={errors['receivedValueOfClient']}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="receivedValueOfClient"
                type="number"
                step="0.01"
                min="0"
                defaultValue={order?.receivedValueOfClient.toString() ?? '0'}
                invalid={!!errors['receivedValueOfClient']}
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
                defaultValue={order?.balanceApplied.toString() ?? '0'}
                invalid={!!errors['balanceApplied']}
                className="pl-7"
              />
            </div>
          </Field>
        </div>

        <Field label="Observaciones (opcional)">
          <TextArea
            name="observations"
            rows={3}
            maxLength={2000}
            defaultValue={order?.observations ?? ''}
          />
        </Field>

        <p className="text-xs text-muted">
          El total de la orden se calcula a partir de sus productos. El estado
          de pago se deriva de lo recibido + saldo aplicado frente al total.
        </p>

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
