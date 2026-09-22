'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, PackageCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Checkbox, Label } from '@heroui/react';
import {
  createPackageAction,
  updatePackageAction,
  type ActionResult,
} from './actions';
import { ImageUploadField } from '@/components/image-upload-field';
import {
  AppModal,
  Field,
  Select,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import { PACKAGE_STATUSES, type PackageRow } from './schema';

interface PackageDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  role: string;
  pkg?: PackageRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

/**
 * Cabecera del paquete. Al crear no se elige estado (nace «Enviado», o
 * «Recibido» si ya está en el almacén) y se puede saltar directo a
 * marcar llegadas. Solo un admin corrige el estado al editar.
 */
export function PackageDialog({
  open,
  mode,
  role,
  pkg,
  onClose,
  onSuccess,
}: PackageDialogProps) {
  const router = useRouter();
  const action = mode === 'create' ? createPackageAction : updatePackageAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);
  const [arrived, setArrived] = useState(true);
  // «Guardar y marcar llegadas» se decide en el submit; se lee al resolver.
  const goToArrivalsRef = useRef(false);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) {
      if (mode === 'create' && goToArrivalsRef.current && state.id) {
        goToArrivalsRef.current = false;
        router.push(`/packages/${state.id}`);
      }
      onSuccess();
    } else if (!state.fieldErrors) {
      toast.error('No se pudo guardar el paquete', {
        description: state.error,
      });
    }
  }, [state, onSuccess, mode, router]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo paquete' : 'Editar paquete'}
      description={
        mode === 'create'
          ? 'Registra el bulto con su tracking y agencia; después marca qué productos llegaron en él.'
          : `Paquete ${pkg?.numberOfTracking ?? ''} de ${pkg?.agencyName ?? ''}`
      }
      icon={<Box className="h-5 w-5" aria-hidden />}
      size="md"
    >
      <form
        key={mode === 'edit' ? (pkg?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && pkg ? (
          <input type="hidden" name="id" value={pkg.id} />
        ) : null}

        <Field label="Número de tracking" required error={errors['numberOfTracking']}>
          <TextInput
            name="numberOfTracking"
            type="text"
            required
            maxLength={100}
            defaultValue={pkg?.numberOfTracking ?? ''}
            invalid={!!errors['numberOfTracking']}
            className="font-mono"
          />
        </Field>

        <Field label="Nombre de la agencia" required error={errors['agencyName']}>
          <TextInput
            name="agencyName"
            type="text"
            required
            maxLength={100}
            defaultValue={pkg?.agencyName ?? ''}
            invalid={!!errors['agencyName']}
          />
        </Field>

        <Field label="Fecha de llegada" required error={errors['arrivalDate']}>
          <TextInput
            name="arrivalDate"
            type="date"
            required
            defaultValue={isoToDateInput(pkg?.arrivalDate)}
            invalid={!!errors['arrivalDate']}
          />
        </Field>

        {mode === 'create' ? (
          <Checkbox
            name="alreadyArrived"
            isSelected={arrived}
            onChange={setArrived}
            className="w-fit rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label className="text-sm font-medium text-foreground">
                Ya está en el almacén (estado «Recibido»)
              </Label>
            </Checkbox.Content>
          </Checkbox>
        ) : role === 'admin' ? (
          <Field
            label="Estado (corrección manual)"
            hint="Normalmente el estado cambia solo al registrar llegadas o terminar la revisión."
          >
            <Select name="statusOfProcessing" defaultValue={pkg?.statusOfProcessing ?? 'Enviado'}>
              {PACKAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <ImageUploadField
          name="packagePicture"
          label="Foto del paquete (opcional)"
          defaultUrl={pkg?.packagePicture}
          capture="environment"
          buttonLabel="Tomar o subir una foto"
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          {mode === 'create' ? (
            <>
              <SubmitButton isPending={isPending}>Guardar</SubmitButton>
              <Button
                type="submit"
                variant="primary"
                isPending={isPending}
                onPress={() => {
                  goToArrivalsRef.current = true;
                }}
              >
                <PackageCheck className="h-4 w-4" aria-hidden />
                Guardar y marcar llegadas
              </Button>
            </>
          ) : (
            <SubmitButton isPending={isPending}>Guardar</SubmitButton>
          )}
        </div>
      </form>
    </AppModal>
  );
}
