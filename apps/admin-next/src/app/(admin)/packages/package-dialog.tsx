'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Box } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
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
  pkg?: PackageRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function PackageDialog({
  open,
  mode,
  pkg,
  onClose,
  onSuccess,
}: PackageDialogProps) {
  const action = mode === 'create' ? createPackageAction : updatePackageAction;
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

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo paquete' : 'Editar paquete'}
      description={
        mode === 'create'
          ? 'Registra un paquete con su tracking, agencia y fecha de llegada.'
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

        <Field
          label="Número de tracking"
          required
          error={errors['numberOfTracking']}
        >
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

        <Field
          label="Nombre de la agencia"
          required
          error={errors['agencyName']}
        >
          <TextInput
            name="agencyName"
            type="text"
            required
            maxLength={100}
            defaultValue={pkg?.agencyName ?? ''}
            invalid={!!errors['agencyName']}
          />
        </Field>

        <Field label="Estado" error={errors['statusOfProcessing']}>
          <Select
            name="statusOfProcessing"
            defaultValue={pkg?.statusOfProcessing ?? 'Enviado'}
            required
            invalid={!!errors['statusOfProcessing']}
          >
            {PACKAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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

        <ImageUploadField
          name="packagePicture"
          label="Foto del paquete (opcional)"
          defaultUrl={pkg?.packagePicture}
        />

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
