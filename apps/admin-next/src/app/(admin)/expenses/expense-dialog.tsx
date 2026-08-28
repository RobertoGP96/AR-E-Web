'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Receipt } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import {
  createExpenseAction,
  updateExpenseAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  Select,
  TextInput,
  TextArea,
  SubmitButton,
} from '@/components/ui';
import { EXPENSE_CATEGORIES, type ExpenseRow } from './schema';

interface ExpenseDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  expense?: ExpenseRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function ExpenseDialog({
  open,
  mode,
  expense,
  onClose,
  onSuccess,
}: ExpenseDialogProps) {
  const action = mode === 'create' ? createExpenseAction : updateExpenseAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors)
      toast.error('No se pudo guardar el gasto', {
        description: state.error,
      });
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo gasto' : 'Editar gasto'}
      description={
        mode === 'create'
          ? 'Registra un gasto del sistema con su categoría.'
          : `Gasto #${expense?.id ?? ''}`
      }
      icon={<Receipt className="h-5 w-5" aria-hidden />}
      size="md"
    >
      <form
        key={mode === 'edit' ? (expense?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && expense ? (
          <input type="hidden" name="id" value={expense.id} />
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Fecha" required error={errors['date']}>
            <TextInput
              name="date"
              type="date"
              defaultValue={isoToDateInput(expense?.date)}
              required
              invalid={!!errors['date']}
            />
          </Field>
          <Field label="Monto" required error={errors['amount']}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={expense?.amount.toString() ?? '0'}
                required
                invalid={!!errors['amount']}
                className="pl-7"
              />
            </div>
          </Field>
        </div>

        <Field label="Categoría" required error={errors['category']}>
          <Select
            name="category"
            defaultValue={expense?.category ?? 'Operativo'}
            required
            invalid={!!errors['category']}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descripción (opcional)" error={errors['description']}>
          <TextArea
            name="description"
            rows={3}
            maxLength={500}
            defaultValue={expense?.description ?? ''}
            invalid={!!errors['description']}
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
