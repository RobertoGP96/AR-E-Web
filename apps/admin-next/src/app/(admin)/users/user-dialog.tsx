'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createUserAction,
  updateUserAction,
  type ActionResult,
} from './actions';
import {
  USER_ROLES,
  type AgentOption,
  type UserRole,
  type UserRow,
} from './schema';

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
  const headingId = useId();
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

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {mode === 'create' ? 'New user' : 'Edit user'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form
          action={formAction}
          className="space-y-4 overflow-y-auto p-5"
        >
          {mode === 'edit' && user ? (
            <input type="hidden" name="id" value={user.id} />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Name"
              name="name"
              defaultValue={user?.name ?? ''}
              error={errors['name']}
              required
            />
            <Field
              label="Last name"
              name="lastName"
              defaultValue={user?.lastName ?? ''}
              error={errors['lastName']}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Phone number"
              name="phoneNumber"
              defaultValue={user?.phoneNumber ?? ''}
              error={errors['phoneNumber']}
              required
            />
            <Field
              label="Email (optional)"
              name="email"
              type="email"
              defaultValue={user?.email ?? ''}
              error={errors['email']}
            />
          </div>

          <Field
            label="Home address"
            name="homeAddress"
            defaultValue={user?.homeAddress ?? ''}
            error={errors['homeAddress']}
          />

          {mode === 'create' ? (
            <Field
              label="Password"
              name="password"
              type="password"
              error={errors['password']}
              required
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-role`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Role
              </label>
              <select
                id={`${headingId}-role`}
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {role === 'agent' ? (
              <Field
                label="Agent profit (%)"
                name="agentProfit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={user?.agentProfit.toString() ?? '0'}
                error={errors['agentProfit']}
              />
            ) : (
              <input
                type="hidden"
                name="agentProfit"
                value={user?.agentProfit ?? 0}
              />
            )}
          </div>

          {role !== 'agent' ? (
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-agent`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Assigned agent
              </label>
              <select
                id={`${headingId}-agent`}
                name="assignedAgentId"
                defaultValue={user?.assignedAgentId ?? ''}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
              >
                <option value="">— None —</option>
                {agentOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="assignedAgentId" value="" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Balance"
              name="balance"
              type="number"
              step="0.01"
              prefix="$"
              defaultValue={user?.balance.toString() ?? '0'}
              error={errors['balance']}
            />
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={user ? user.isActive : true}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  defaultValue?: string;
  error?: string;
  required?: boolean;
  step?: string;
  min?: string;
  prefix?: string;
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  error,
  required,
  step,
  min,
  prefix,
}: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          step={step}
          min={min}
          required={required}
          defaultValue={defaultValue}
          className={`w-full rounded-md border bg-white py-2 ${
            prefix ? 'pl-7' : 'pl-3'
          } pr-3 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
            error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
          }`}
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
