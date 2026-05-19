'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { toast } from 'sonner';
import { updateCommonInfoAction, type ActionResult } from './actions';

interface SettingsFormProps {
  defaults: { changeRate: number; costPerPound: number };
}

export function SettingsForm({ defaults }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(updateCommonInfoAction, undefined);
  const ref = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === ref.current) return;
    ref.current = state;
    if (state.ok) toast.success('Settings saved');
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state]);

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Field
        label="Change rate"
        name="changeRate"
        defaultValue={defaults.changeRate.toString()}
        error={errors['changeRate']}
        hint="Currency conversion rate used across the system."
      />
      <Field
        label="Cost per pound (USD)"
        name="costPerPound"
        defaultValue={defaults.costPerPound.toString()}
        error={errors['costPerPound']}
        hint="Base shipping cost per pound."
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        step="0.01"
        min="0"
        defaultValue={defaultValue}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
