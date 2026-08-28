'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Settings, SlidersHorizontal, Lock } from 'lucide-react';
import { toast } from '@/lib/toast';
import { updateCommonInfoAction, type ActionResult } from './actions';
import { Field, TextInput, SubmitButton } from '@/components/ui';

interface SettingsFormProps {
  defaults: { changeRate: number; costPerPound: number };
  canEdit: boolean;
}

export function SettingsForm({ defaults, canEdit }: SettingsFormProps) {
  return canEdit ? (
    <EditableSettingsCard defaults={defaults} />
  ) : (
    <ReadOnlySettingsCard defaults={defaults} />
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Settings;
  title: string;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2.5 border-b border-separator pb-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  );
}

function EditableSettingsCard({
  defaults,
}: {
  defaults: SettingsFormProps['defaults'];
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(updateCommonInfoAction, undefined);
  const ref = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === ref.current) return;
    ref.current = state;
    if (state.ok)
      toast.success('Ajustes guardados', {
        description:
          'Los parámetros del sistema se actualizaron correctamente.',
      });
    else if (!state.fieldErrors)
      toast.error('No se pudieron guardar los ajustes', {
        description: state.error,
      });
  }, [state]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="surface-card max-w-md p-5">
      <SectionHeading icon={SlidersHorizontal} title="Parámetros del sistema" />
      <form action={formAction} className="mt-4 space-y-4">
        <Field
          label="Tasa de cambio"
          error={errors['changeRate']}
          hint="Tasa de conversión de moneda usada en todo el sistema."
        >
          <TextInput
            name="changeRate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.changeRate.toString()}
            invalid={!!errors['changeRate']}
          />
        </Field>
        <Field
          label="Costo por libra (USD)"
          error={errors['costPerPound']}
          hint="Costo base de envío por libra."
        >
          <TextInput
            name="costPerPound"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.costPerPound.toString()}
            invalid={!!errors['costPerPound']}
          />
        </Field>
        <div className="flex justify-end pt-1">
          <SubmitButton isPending={isPending}>Guardar ajustes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function ReadOnlySettingsCard({
  defaults,
}: {
  defaults: SettingsFormProps['defaults'];
}) {
  return (
    <div className="surface-card max-w-md p-5">
      <SectionHeading icon={Lock} title="Parámetros del sistema" />
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Tasa de cambio</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {defaults.changeRate.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Costo por libra (USD)</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {defaults.costPerPound.toFixed(2)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg bg-default px-3 py-2 text-xs text-muted">
        Solo los roles administrador o contador pueden modificar estos valores.
      </p>
    </div>
  );
}
