'use client';

import { useActionState, useEffect, useRef } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import { changePasswordAction, type ActionResult } from './actions';
import { AppModal, Field, TextInput, SubmitButton } from '@/components/ui';
import type { UserRow } from './schema';

interface ChangePasswordDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordDialog({
  user,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(changePasswordAction, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors)
      toast.error('No se pudo cambiar la contraseña', {
        description: state.error,
      });
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <AppModal
      isOpen={user !== null}
      onClose={onClose}
      title="Cambiar contraseña"
      description={
        user ? (
          <>
            Establece una nueva contraseña para{' '}
            <strong className="text-foreground">
              {user.name} {user.lastName}
            </strong>
            .
          </>
        ) : null
      }
      icon={<KeyRound className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <form
        key={user?.id ?? 'none'}
        action={formAction}
        className="space-y-4"
      >
        <input type="hidden" name="id" value={user?.id ?? ''} />

        <Field label="Nueva contraseña" required error={errors['password']}>
          <TextInput
            name="password"
            type="password"
            required
            autoComplete="new-password"
            invalid={!!errors['password']}
          />
        </Field>

        <Field label="Confirmar contraseña" required error={errors['confirm']}>
          <TextInput
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            invalid={!!errors['confirm']}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <SubmitButton isPending={isPending}>
            Actualizar contraseña
          </SubmitButton>
        </div>
      </form>
    </AppModal>
  );
}
