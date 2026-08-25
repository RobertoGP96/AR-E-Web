'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Checkbox, Label } from '@heroui/react';
import {
  createUserAction,
  updateUserAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  Select,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import {
  USER_ROLES,
  type AgentOption,
  type UserRole,
  type UserRow,
} from './schema';

/** Etiquetas en español para los roles del sistema. */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Usuario',
  agent: 'Agente',
  accountant: 'Contador',
  logistical: 'Logístico',
  admin: 'Administrador',
  client: 'Cliente',
};

interface UserDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: UserRow;
  agentOptions: AgentOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserDialog({
  open,
  mode,
  user,
  agentOptions,
  onClose,
  onSuccess,
}: UserDialogProps) {
  const action = mode === 'create' ? createUserAction : updateUserAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const [role, setRole] = useState<UserRole>(user?.role ?? 'client');
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  // Reset role when the dialog (re)opens for a target, done during render
  // (not in an effect) to avoid a flash of stale state.
  const signature = `${open}-${mode}-${user?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setRole(user?.role ?? 'client');
  }

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
      title={mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
      description={
        mode === 'create'
          ? 'Crea una cuenta y define su rol en el sistema.'
          : `Editando a ${user?.name ?? ''} ${user?.lastName ?? ''}`
      }
      icon={<UserRound className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (user?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && user ? (
          <input type="hidden" name="id" value={user.id} />
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre" required error={errors['name']}>
            <TextInput
              name="name"
              defaultValue={user?.name ?? ''}
              required
              invalid={!!errors['name']}
            />
          </Field>
          <Field label="Apellidos" required error={errors['lastName']}>
            <TextInput
              name="lastName"
              defaultValue={user?.lastName ?? ''}
              required
              invalid={!!errors['lastName']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Teléfono" required error={errors['phoneNumber']}>
            <TextInput
              name="phoneNumber"
              defaultValue={user?.phoneNumber ?? ''}
              required
              invalid={!!errors['phoneNumber']}
            />
          </Field>
          <Field label="Email (opcional)" error={errors['email']}>
            <TextInput
              name="email"
              type="email"
              defaultValue={user?.email ?? ''}
              invalid={!!errors['email']}
            />
          </Field>
        </div>

        <Field label="Dirección" error={errors['homeAddress']}>
          <TextInput
            name="homeAddress"
            defaultValue={user?.homeAddress ?? ''}
            invalid={!!errors['homeAddress']}
          />
        </Field>

        {mode === 'create' ? (
          <Field label="Contraseña" required error={errors['password']}>
            <TextInput
              name="password"
              type="password"
              autoComplete="new-password"
              required
              invalid={!!errors['password']}
            />
          </Field>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Rol">
            <Select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </Select>
          </Field>

          {role === 'agent' ? (
            <Field label="Ganancia de agente (%)" error={errors['agentProfit']}>
              <TextInput
                name="agentProfit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={user?.agentProfit.toString() ?? '0'}
                invalid={!!errors['agentProfit']}
              />
            </Field>
          ) : (
            <input
              type="hidden"
              name="agentProfit"
              value={user?.agentProfit ?? 0}
            />
          )}
        </div>

        {role !== 'agent' ? (
          <Field label="Agente asignado">
            <Select
              name="assignedAgentId"
              defaultValue={user?.assignedAgentId ?? ''}
            >
              <option value="">— Ninguno —</option>
              {agentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({ROLE_LABELS[a.role] ?? a.role})
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <input type="hidden" name="assignedAgentId" value="" />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Balance" error={errors['balance']}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="balance"
                type="number"
                step="0.01"
                defaultValue={user?.balance.toString() ?? '0'}
                invalid={!!errors['balance']}
                className="pl-7"
              />
            </div>
          </Field>
          <Checkbox
            name="isActive"
            defaultSelected={user ? user.isActive : true}
            className="w-fit self-end rounded-lg border border-border px-3 py-2 transition-colors hover:bg-default"
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label className="text-sm font-medium text-foreground">
                Activo
              </Label>
            </Checkbox.Content>
          </Checkbox>
        </div>

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
