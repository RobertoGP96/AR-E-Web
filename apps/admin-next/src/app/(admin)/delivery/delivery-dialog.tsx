'use client';

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDeliveryAction,
  updateDeliveryAction,
  type ActionResult,
} from './actions';
import { round2 } from '@/lib/order-cost';
import { formatCurrency } from '@/lib/format';
import { ImageUploadField } from '@/components/image-upload-field';
import {
  DELIVERY_STATUSES,
  type CategoryOption,
  type ClientOption,
  type DeliveryRow,
} from './schema';

interface DeliveryDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  delivery?: DeliveryRow;
  clientOptions: ClientOption[];
  categoryOptions: CategoryOption[];
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function DeliveryDialog({
  open,
  mode,
  delivery,
  clientOptions,
  categoryOptions,
  onClose,
  onSuccess,
}: DeliveryDialogProps) {
  const headingId = useId();
  const action =
    mode === 'create' ? createDeliveryAction : updateDeliveryAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  const [weight, setWeight] = useState(delivery?.weight ?? 0);
  const [categoryId, setCategoryId] = useState(delivery?.categoryId ?? '');

  const signature = `${open}-${mode}-${delivery?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setWeight(delivery?.weight ?? 0);
    setCategoryId(delivery?.categoryId ?? '');
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const cat = categoryOptions.find((c) => c.id === categoryId);
  const weightCostPreview = round2(
    weight * (cat?.clientShippingCharge ?? 0)
  );

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
            {mode === 'create' ? 'New delivery' : 'Edit delivery'}
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
          {mode === 'edit' && delivery ? (
            <input type="hidden" name="id" value={delivery.id} />
          ) : null}

          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-client`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Client
            </label>
            <select
              id={`${headingId}-client`}
              name="clientId"
              defaultValue={delivery?.clientId ?? ''}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-950 ${
                errors['clientId']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <option value="">— Select a client —</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors['clientId'] ? (
              <p className="text-xs text-red-600">{errors['clientId']}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-cat`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Category (optional)
              </label>
              <select
                id={`${headingId}-cat`}
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">— None —</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} (${c.clientShippingCharge.toFixed(2)}/lb)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-w`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Weight (lb)
              </label>
              <input
                id={`${headingId}-w`}
                name="weight"
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-950 ${
                  errors['weight']
                    ? 'border-red-500'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors['weight'] ? (
                <p className="text-xs text-red-600">{errors['weight']}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-st`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Status
              </label>
              <select
                id={`${headingId}-st`}
                name="status"
                defaultValue={delivery?.status ?? 'Pendiente'}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {DELIVERY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Delivery date"
              name="deliverDate"
              type="date"
              defaultValue={isoToDateInput(delivery?.deliverDate)}
              error={errors['deliverDate']}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Payment amount"
              name="paymentAmount"
              type="number"
              prefix="$"
              defaultValue={delivery?.paymentAmount.toString() ?? '0'}
              error={errors['paymentAmount']}
            />
            <Field
              label="Balance applied"
              name="balanceApplied"
              type="number"
              prefix="$"
              defaultValue={delivery?.balanceApplied.toString() ?? '0'}
              error={errors['balanceApplied']}
            />
          </div>

          <ImageUploadField
            name="deliverPicture"
            label="Delivery picture (optional)"
            defaultUrl={delivery?.deliverPicture}
          />

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Weight cost (weight × category charge)
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(weightCostPreview)}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Weight cost & manager profit are recomputed server-side from
              the category rate and the client&apos;s assigned agent.
            </p>
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

function Field({
  label,
  name,
  type,
  defaultValue,
  error,
  required,
  prefix,
}: {
  label: string;
  name: string;
  type: 'number' | 'date' | 'url';
  defaultValue?: string;
  error?: string;
  required?: boolean;
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
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          min={type === 'number' ? '0' : undefined}
          required={required}
          defaultValue={defaultValue}
          className={`w-full rounded-md border bg-white py-2 ${
            prefix ? 'pl-7' : 'pl-3'
          } pr-3 text-sm dark:bg-zinc-950 ${
            error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
          }`}
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
