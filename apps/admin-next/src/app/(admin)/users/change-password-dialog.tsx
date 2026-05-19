'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { changePasswordAction, type ActionResult } from './actions';
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
  const headingId = useId();
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(changePasswordAction, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  useEffect(() => {
    if (user) lastHandledRef.current = undefined;
  }, [user]);

  if (!user) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            Change password
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
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Set a new password for{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {user.name} {user.lastName}
          </strong>
          .
        </p>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-pw`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              New password
            </label>
            <input
              id={`${headingId}-pw`}
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['password']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors['password'] ? (
              <p className="text-xs text-red-600">{errors['password']}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-cf`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Confirm password
            </label>
            <input
              id={`${headingId}-cf`}
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['confirm']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors['confirm'] ? (
              <p className="text-xs text-red-600">{errors['confirm']}</p>
            ) : null}
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
              {isPending ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
