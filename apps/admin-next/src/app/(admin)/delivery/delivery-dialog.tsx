'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Truck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import { updateDeliveryAction, type ActionResult } from './actions';
import { ImageUploadField } from '@/components/image-upload-field';
import { AppModal, Field, TextInput, SubmitButton } from '@/components/ui';
import type { DeliveryRow } from './schema';

interface DeliveryDialogProps {
  open: boolean;
  delivery?: DeliveryRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

/**
 * Edición de la cabecera de una entrega: solo fecha y foto. El cliente
 * y la categoría los fija la bolsa, el peso «Pesar»/«Corregir peso» y
 * el estado las acciones de la entrega (ADR-0004).
 */
export function DeliveryDialog({
  open,
  delivery,
  onClose,
  onSuccess,
}: DeliveryDialogProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(updateDeliveryAction, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors)
      toast.error('No se pudo guardar la entrega', { description: state.error });
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Editar entrega"
      description={`Entrega #${delivery?.id ?? ''} de ${delivery?.clientName ?? ''}${
        delivery?.categoryName ? ` · ${delivery.categoryName}` : ''
      }`}
      icon={<Truck className="h-5 w-5" aria-hidden />}
      size="md"
    >
      <form key={delivery?.id ?? 'edit'} action={formAction} className="space-y-4">
        {delivery ? <input type="hidden" name="id" value={delivery.id} /> : null}

        <Field label="Fecha de entrega" required error={errors['deliverDate']}>
          <TextInput
            name="deliverDate"
            type="date"
            required
            defaultValue={isoToDateInput(delivery?.deliverDate)}
            invalid={!!errors['deliverDate']}
          />
        </Field>

        <ImageUploadField
          name="deliverPicture"
          label="Foto de la entrega (opcional)"
          defaultUrl={delivery?.deliverPicture}
          capture="environment"
          buttonLabel="Tomar o subir una foto"
        />

        <p className="text-xs text-muted">
          El peso, el costo y el estado se cambian con las acciones de la
          entrega («Pesar», «Despachar», «Marcar entregada»…), no aquí.
        </p>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <SubmitButton isPending={isPending}>Guardar</SubmitButton>
        </div>
      </form>
    </AppModal>
  );
}
