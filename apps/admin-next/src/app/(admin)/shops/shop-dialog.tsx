'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Store } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Checkbox, Label } from '@heroui/react';
import {
  createShopAction,
  updateShopAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import type { ShopRow } from './schema';

interface ShopDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  shop?: ShopRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShopDialog({
  open,
  mode,
  shop,
  onClose,
  onSuccess,
}: ShopDialogProps) {
  const action = mode === 'create' ? createShopAction : updateShopAction;
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
      toast.error('No se pudo guardar la tienda', {
        description: state.error,
      });
  }, [state, onSuccess]);

  useEffect(() => {
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const isActiveDefault = shop ? shop.isActive : true;

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva tienda' : 'Editar tienda'}
      description={
        mode === 'create'
          ? 'Registra una tienda y su enlace de compra.'
          : `Tienda «${shop?.name ?? ''}»`
      }
      icon={<Store className="h-5 w-5" aria-hidden />}
      size="md"
    >
      <form
        key={mode === 'edit' ? (shop?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && shop ? (
          <input type="hidden" name="id" value={shop.id} />
        ) : null}

        <Field label="Nombre de la tienda" required error={errors['name']}>
          <TextInput
            name="name"
            type="text"
            maxLength={100}
            required
            defaultValue={shop?.name ?? ''}
            invalid={!!errors['name']}
          />
        </Field>

        <Field label="Enlace de la tienda" required error={errors['link']}>
          <TextInput
            name="link"
            type="url"
            placeholder="https://ejemplo.com"
            required
            defaultValue={shop?.link ?? ''}
            invalid={!!errors['link']}
          />
        </Field>

        <Field label="Tasa de impuesto (%)" required error={errors['taxRate']}>
          <div className="relative">
            <TextInput
              name="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              required
              defaultValue={shop?.taxRate.toString() ?? '0'}
              invalid={!!errors['taxRate']}
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              %
            </span>
          </div>
        </Field>

        <Checkbox
          name="isActive"
          defaultSelected={isActiveDefault}
          className="w-fit rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label className="text-sm font-medium text-foreground">
              Tienda activa
            </Label>
          </Checkbox.Content>
        </Checkbox>

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
