'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { toast } from 'sonner';
import {
  updateProfileAction,
  changeOwnPasswordAction,
  type ActionResult,
} from './actions';

interface ProfileFormsProps {
  defaults: {
    name: string;
    lastName: string;
    email: string;
    homeAddress: string;
  };
}

export function ProfileForms({ defaults }: ProfileFormsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ProfileCard defaults={defaults} />
      <PasswordCard />
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

function ProfileCard({ defaults }: ProfileFormsProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(updateProfileAction, undefined);
  useHandled(state, 'Profile updated');
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Account details
      </h2>
      <form action={formAction} className="space-y-4">
        <Field
          label="Name"
          name="name"
          defaultValue={defaults.name}
          error={errors['name']}
        />
        <Field
          label="Last name"
          name="lastName"
          defaultValue={defaults.lastName}
          error={errors['lastName']}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={defaults.email}
          error={errors['email']}
        />
        <Field
          label="Home address"
          name="homeAddress"
          defaultValue={defaults.homeAddress}
          error={errors['homeAddress']}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
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
  useHandled(state, 'Password changed', () => formRef.current?.reset());
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Change password
      </h2>
      <form ref={formRef} action={formAction} className="space-y-4">
        <Field
          label="Current password"
          name="current"
          type="password"
          error={errors['current']}
        />
        <Field
          label="New password"
          name="next"
          type="password"
          error={errors['next']}
        />
        <Field
          label="Confirm new password"
          name="confirm"
          type="password"
          error={errors['confirm']}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  defaultValue?: string;
  error?: string;
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
        type={type}
        defaultValue={defaultValue}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
