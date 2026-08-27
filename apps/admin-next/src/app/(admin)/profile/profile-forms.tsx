'use client';

import { useActionState, useEffect, useRef } from 'react';
import { UserRound, Lock } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Chip } from '@heroui/react';
import {
  updateProfileAction,
  changeOwnPasswordAction,
  type ActionResult,
} from './actions';
import { Field, TextInput, SubmitButton, PageHeader } from '@/components/ui';

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuario',
  agent: 'Agente',
  accountant: 'Contador',
  logistical: 'Logístico',
  admin: 'Administrador',
  client: 'Cliente',
};

interface ProfileDefaults {
  name: string;
  lastName: string;
  email: string;
  homeAddress: string;
}

interface ProfileFormsProps {
  defaults: ProfileDefaults;
  phoneNumber: string;
  role: string;
}

export function ProfileForms({
  defaults,
  phoneNumber,
  role,
}: ProfileFormsProps) {
  return (
    <div>
      <PageHeader
        icon={UserRound}
        title="Mi Perfil"
        subtitle="Gestiona tu información personal y configuración de cuenta"
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileCard
          defaults={defaults}
          phoneNumber={phoneNumber}
          role={role}
        />
        <PasswordCard />
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  extra,
}: {
  icon: typeof UserRound;
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-between gap-2 border-b border-separator pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {extra}
    </div>
  );
}

function useHandled(
  state: ActionResult | undefined,
  okMsg: string,
  onOk?: () => void
) {
  const ref = useRef<ActionResult | undefined>(undefined);
  useEffect(() => {
    if (!state || state === ref.current) return;
    ref.current = state;
    if (state.ok) {
      toast.success(okMsg);
      onOk?.();
    } else if (!state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, okMsg, onOk]);
}

function ProfileCard({ defaults, phoneNumber, role }: ProfileFormsProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(updateProfileAction, undefined);
  useHandled(state, 'Perfil actualizado');
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="surface-card p-5">
      <SectionHeading
        icon={UserRound}
        title="Datos personales"
        extra={
          <Chip
            color="accent"
            variant="soft"
            size="sm"
            className="whitespace-nowrap"
          >
            <Chip.Label>{ROLE_LABELS[role] ?? role}</Chip.Label>
          </Chip>
        }
      />
      <form action={formAction} className="mt-4 space-y-4">
        <Field label="Nombre" error={errors['name']}>
          <TextInput
            name="name"
            type="text"
            defaultValue={defaults.name}
            invalid={!!errors['name']}
          />
        </Field>
        <Field label="Apellidos" error={errors['lastName']}>
          <TextInput
            name="lastName"
            type="text"
            defaultValue={defaults.lastName}
            invalid={!!errors['lastName']}
          />
        </Field>
        <Field label="Email" error={errors['email']}>
          <TextInput
            name="email"
            type="email"
            defaultValue={defaults.email}
            invalid={!!errors['email']}
          />
        </Field>
        <Field label="Dirección" error={errors['homeAddress']}>
          <TextInput
            name="homeAddress"
            type="text"
            defaultValue={defaults.homeAddress}
            invalid={!!errors['homeAddress']}
          />
        </Field>
        <Field
          label="Teléfono"
          hint="El teléfono no puede cambiarse desde aquí."
        >
          <TextInput type="text" defaultValue={phoneNumber} disabled />
        </Field>
        <div className="flex justify-end pt-1">
          <SubmitButton isPending={isPending}>Guardar cambios</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function PasswordCard() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(changeOwnPasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useHandled(state, 'Contraseña cambiada', () => formRef.current?.reset());
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="surface-card p-5">
      <SectionHeading icon={Lock} title="Cambiar contraseña" />
      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <Field label="Contraseña actual" error={errors['current']}>
          <TextInput
            name="current"
            type="password"
            autoComplete="new-password"
            invalid={!!errors['current']}
          />
        </Field>
        <Field label="Nueva contraseña" error={errors['next']}>
          <TextInput
            name="next"
            type="password"
            autoComplete="new-password"
            invalid={!!errors['next']}
          />
        </Field>
        <Field label="Confirmar nueva contraseña" error={errors['confirm']}>
          <TextInput
            name="confirm"
            type="password"
            autoComplete="new-password"
            invalid={!!errors['confirm']}
          />
        </Field>
        <div className="flex justify-end pt-1">
          <SubmitButton isPending={isPending}>
            Actualizar contraseña
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
