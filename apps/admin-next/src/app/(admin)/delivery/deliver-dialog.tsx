'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { ImageUploadField } from '@/components/image-upload-field';
import { AppModal, Field, TextInput } from '@/components/ui';
import { transitionDeliveryStatusAction } from './actions';

/**
 * «Marcar entregada»: fecha real de entrega y foto opcional (la cámara
 * se abre directamente en móvil). Al confirmar, los productos de la
 * entrega pasan a «Entregado» (RN-011).
 */
export function DeliverDialog({
  open,
  delivery,
  onClose,
}: {
  open: boolean;
  delivery: { id: string; clientName: string; deliverPicture: string | null };
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const formId = `deliver-${delivery.id}`;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const picture = String(fd.get('deliverPicture') ?? '');
    startTransition(async () => {
      const result = await transitionDeliveryStatusAction(delivery.id, 'deliver', {
        deliverDate: date,
        deliverPicture: picture,
      });
      if (result.ok) {
        toast.success(`Entrega #${delivery.id} entregada`, {
          description: `${delivery.clientName} · los productos pasan a «Entregado».`,
        });
        onClose();
      } else {
        toast.error('No se pudo marcar como entregada', {
          description: result.error,
        });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Marcar entregada"
      description={`Entrega #${delivery.id} de ${delivery.clientName}`}
      icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <Field label="Fecha de entrega" required>
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>
        <ImageUploadField
          name="deliverPicture"
          label="Foto de la entrega (opcional)"
          defaultUrl={delivery.deliverPicture}
          capture="environment"
          buttonLabel="Tomar o subir una foto"
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isDisabled={isPending} className="h-11 sm:h-auto">
            {isPending ? <Spinner size="sm" color="current" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
            Confirmar entrega
          </Button>
        </div>
      </form>
    </AppModal>
  );
}
