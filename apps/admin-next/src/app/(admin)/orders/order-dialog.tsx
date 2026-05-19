'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createOrderAction,
  updateOrderAction,
  type ActionResult,
} from './actions';
import {
  ORDER_STATUSES,
  type OrderRow,
  type SelectOption,
} from './schema';

interface OrderDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  order?: OrderRow;
  clientOptions: SelectOption[];
  managerOptions: SelectOption[];
  onClose: () => void;
  onSuccess: (newId?: string) => void;
}

export function OrderDialog({
  open,
  mode,
  order,
  clientOptions,
  managerOptions,
  onClose,
  onSuccess,
}: OrderDialogProps) {
  const headingId = useId();
  const action = mode === 'create' ? createOrderAction : updateOrderAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess(state.id);
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
            {mode === 'create' ? 'New order' : 'Edit order'}
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

        <form action={formAction} className="space-y-4 overflow-y-auto p-5">
          {mode === 'edit' && order ? (
            <input type="hidden" name="id" value={order.id} />
          ) : null}

          <Select
            label="Client"
            name="clientId"
            options={clientOptions}
            defaultValue={order?.clientId ?? ''}
            error={errors['clientId']}
            placeholder="— Select a client —"
            required
          />

          <Select
            label="Sales manager (optional)"
            name="salesManagerId"
            options={managerOptions}
            defaultValue=""
            placeholder="— None —"
          />

          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-status`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Status
            </label>
            <select
              id={`${headingId}-status`}
              name="status"
              defaultValue={order?.status ?? 'Encargado'}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Received from client"
              name="receivedValueOfClient"
              prefix="$"
              defaultValue={order?.receivedValueOfClient.toString() ?? '0'}
              error={errors['receivedValueOfClient']}
            />
            <NumberField
              label="Balance applied"
              name="balanceApplied"
              prefix="$"
              defaultValue={order?.balanceApplied.toString() ?? '0'}
              error={errors['balanceApplied']}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-obs`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Observations (optional)
            </label>
            <textarea
              id={`${headingId}-obs`}
              name="observations"
              rows={3}
              maxLength={2000}
              defaultValue={order?.observations ?? ''}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
            />
          </div>

          <p className="text-xs text-zinc-500">
            Order total is computed from its products. Pay status is derived
            from received + balance applied vs. total.
          </p>

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

function Select({
  label,
  name,
  options,
  defaultValue,
  error,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue: string;
  error?: string;
  placeholder: string;
  required?: boolean;
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
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  error,
  prefix,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  prefix?: string;
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
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min="0"
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
