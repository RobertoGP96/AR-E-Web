'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Tag } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import {
  createCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import type { CategoryRow } from './schema';

interface CategoryDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  category?: CategoryRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const action =
    mode === 'create' ? createCategoryAction : updateCategoryAction;
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
      toast.error('No se pudo guardar la categoría', {
        description: state.error,
      });
  }, [state, onSuccess]);

  useEffect(() => {
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
      description={
        mode === 'create'
          ? 'Define la categoría y sus tarifas de envío por libra.'
          : `Categoría «${category?.name ?? ''}»`
      }
      icon={<Tag className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <form
        key={mode === 'edit' ? (category?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && category ? (
          <input type="hidden" name="id" value={category.id} />
        ) : null}

        <Field label="Nombre" required error={errors['name']}>
          <TextInput
            name="name"
            type="text"
            required
            defaultValue={category?.name ?? ''}
            invalid={!!errors['name']}
          />
        </Field>

        <Field
          label="Costo de envío por lb"
          required
          error={errors['shippingCostPerPound']}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <TextInput
              name="shippingCostPerPound"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              defaultValue={category?.shippingCostPerPound.toString() ?? '0'}
              invalid={!!errors['shippingCostPerPound']}
              className="pl-7"
            />
          </div>
        </Field>

        <Field
          label="Cargo al cliente por lb"
          required
          error={errors['clientShippingCharge']}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <TextInput
              name="clientShippingCharge"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              defaultValue={category?.clientShippingCharge.toString() ?? '0'}
              invalid={!!errors['clientShippingCharge']}
              className="pl-7"
            />
          </div>
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
