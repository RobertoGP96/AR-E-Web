'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createShopAction,
  updateShopAction,
  type ActionResult,
} from './actions';
import type { ShopRow } from './schema';

interface ShopDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  shop?: ShopRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShopDialog({
  open,
  mode,
  shop,
  onClose,
  onSuccess,
}: ShopDialogProps) {
  const headingId = useId();
  const action = mode === 'create' ? createShopAction : updateShopAction;
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
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const isActiveDefault = shop ? shop.isActive : true;

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
            {mode === 'create' ? 'New shop' : 'Edit shop'}
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
          {mode === 'edit' && shop ? (
            <input type="hidden" name="id" value={shop.id} />
          ) : null}

          <Field
            label="Shop name"
            name="name"
            type="text"
            defaultValue={shop?.name ?? ''}
            error={errors['name']}
            required
            maxLength={100}
          />

          <Field
            label="Shop link"
            name="link"
            type="url"
            placeholder="https://example.com"
            defaultValue={shop?.link ?? ''}
            error={errors['link']}
            required
          />

          <Field
            label="Tax rate (%)"
            name="taxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0.00"
            defaultValue={shop?.taxRate.toString() ?? '0'}
            error={errors['taxRate']}
            required
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={isActiveDefault}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Active</span>
          </label>

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
  type: 'text' | 'number' | 'url';
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  maxLength?: number;
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
  max,
  maxLength,
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
      <input
        id={id}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        maxLength={maxLength}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
