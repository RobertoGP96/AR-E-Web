'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@heroui/react';
import {
  createBalanceAction,
  updateBalanceAction,
  type ActionResult,
} from './actions';
import { formatDate } from '@/lib/format';
import {
  AppModal,
  Field,
  TextInput,
  TextArea,
  SubmitButton,
} from '@/components/ui';
import type { BalanceRow } from './schema';

interface BalanceDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  balance?: BalanceRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

/** Campo numérico con prefijo $ (mantiene el input nativo para FormData). */
function MoneyInput({
  name,
  defaultValue,
  invalid,
}: {
  name: string;
  defaultValue: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        $
      </span>
      <TextInput
        name={name}
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={defaultValue}
        invalid={invalid}
        className="pl-7"
      />
    </div>
  );
}

export function BalanceDialog({
  open,
  mode,
  balance,
  onClose,
  onSuccess,
}: BalanceDialogProps) {
  const action = mode === 'create' ? createBalanceAction : updateBalanceAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);

  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  useEffect(() => {
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo balance' : 'Editar balance'}
      description={
        mode === 'create'
          ? 'Registra un período con sus pesos, ingresos y costos.'
          : balance
            ? `Período ${formatDate(balance.startDate)} → ${formatDate(balance.endDate)}`
            : undefined
      }
      icon={<Scale className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (balance?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && balance ? (
          <input type="hidden" name="id" value={balance.id} />
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Fecha inicio" required error={errors['startDate']}>
            <TextInput
              name="startDate"
              type="date"
              required
              defaultValue={isoToDateInput(balance?.startDate)}
              invalid={!!errors['startDate']}
            />
          </Field>
          <Field label="Fecha fin" required error={errors['endDate']}>
            <TextInput
              name="endDate"
              type="date"
              required
              defaultValue={isoToDateInput(balance?.endDate)}
              invalid={!!errors['endDate']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Peso del sistema"
            required
            error={errors['systemWeight']}
          >
            <TextInput
              name="systemWeight"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={balance?.systemWeight.toString() ?? '0'}
              invalid={!!errors['systemWeight']}
            />
          </Field>
          <Field
            label="Peso registrado"
            required
            error={errors['registeredWeight']}
          >
            <TextInput
              name="registeredWeight"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={balance?.registeredWeight.toString() ?? '0'}
              invalid={!!errors['registeredWeight']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Ingresos" required error={errors['revenues']}>
            <MoneyInput
              name="revenues"
              defaultValue={balance?.revenues.toString() ?? '0'}
              invalid={!!errors['revenues']}
            />
          </Field>
          <Field
            label="Costos de compras"
            required
            error={errors['buysCosts']}
          >
            <MoneyInput
              name="buysCosts"
              defaultValue={balance?.buysCosts.toString() ?? '0'}
              invalid={!!errors['buysCosts']}
            />
          </Field>
          <Field label="Costos" required error={errors['costs']}>
            <MoneyInput
              name="costs"
              defaultValue={balance?.costs.toString() ?? '0'}
              invalid={!!errors['costs']}
            />
          </Field>
          <Field label="Gastos" required error={errors['expenses']}>
            <MoneyInput
              name="expenses"
              defaultValue={balance?.expenses.toString() ?? '0'}
              invalid={!!errors['expenses']}
            />
          </Field>
        </div>

        <Field label="Notas (opcional)" error={errors['notes']}>
          <TextArea
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={balance?.notes ?? ''}
            invalid={!!errors['notes']}
          />
        </Field>

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
