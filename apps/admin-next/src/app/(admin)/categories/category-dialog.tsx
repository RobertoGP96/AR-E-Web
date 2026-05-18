'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from './actions';
import type { CategoryRow } from './schema';

interface CategoryDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  category?: CategoryRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const headingId = useId();
  const action = mode === 'create' ? createCategoryAction : updateCategoryAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);

  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) {
      onSuccess();
    } else if (!state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  useEffect(() => {
    if (open) {
      lastHandledRef.current = undefined;
    }
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
            {mode === 'create' ? 'New category' : 'Edit category'}
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
          {mode === 'edit' && category ? (
            <input type="hidden" name="id" value={category.id} />
          ) : null}

          <Field
            label="Name"
            name="name"
            type="text"
            defaultValue={category?.name ?? ''}
            error={errors['name']}
            required
          />

          <Field
            label="Shipping cost per lb"
            name="shippingCostPerPound"
            type="number"
            step="0.01"
            min="0"
            prefix="$"
            placeholder="0.00"
            defaultValue={category?.shippingCostPerPound.toString() ?? '0'}
            error={errors['shippingCostPerPound']}
            required
          />

          <Field
            label="Client charge per lb"
            name="clientShippingCharge"
            type="number"
            step="0.01"
            min="0"
            prefix="$"
            placeholder="0.00"
            defaultValue={category?.clientShippingCharge.toString() ?? '0'}
            error={errors['clientShippingCharge']}
            required
          />

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
  type: 'text' | 'number';
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
            error
              ? 'border-red-500'
              : 'border-zinc-300 dark:border-zinc-700'
          }`}
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
