'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createExpenseAction,
  updateExpenseAction,
  type ActionResult,
} from './actions';
import { EXPENSE_CATEGORIES, type ExpenseRow } from './schema';

interface ExpenseDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  expense?: ExpenseRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function ExpenseDialog({
  open,
  mode,
  expense,
  onClose,
  onSuccess,
}: ExpenseDialogProps) {
  const headingId = useId();
  const action = mode === 'create' ? createExpenseAction : updateExpenseAction;
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

  useEffect(() => {
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  if (!open) return null;

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
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {mode === 'create' ? 'New expense' : 'Edit expense'}
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

        <form action={formAction} className="space-y-4">
          {mode === 'edit' && expense ? (
            <input type="hidden" name="id" value={expense.id} />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date"
              name="date"
              type="date"
              defaultValue={isoToDateInput(expense?.date)}
              error={errors['date']}
              required
            />
            <Field
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              prefix="$"
              placeholder="0.00"
              defaultValue={expense?.amount.toString() ?? '0'}
              error={errors['amount']}
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="category"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={expense?.category ?? 'Operativo'}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['category']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors['category'] ? (
              <p className="text-xs text-red-600">{errors['category']}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={expense?.description ?? ''}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['description']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors['description'] ? (
              <p className="text-xs text-red-600">{errors['description']}</p>
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
  type: 'number' | 'date';
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  step?: string;
  min?: string;
  prefix?: string;
}

function Field({
  label,
  name,
  type,
  defaultValue,
  placeholder,
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
          placeholder={placeholder}
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
