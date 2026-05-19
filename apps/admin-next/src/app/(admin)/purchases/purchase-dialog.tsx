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
  createPurchaseAction,
  updatePurchaseAction,
  type ActionResult,
} from './actions';
import {
  PAY_STATUSES,
  type PurchaseRow,
  type ShopWithAccounts,
} from './schema';

interface PurchaseDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  purchase?: PurchaseRow;
  shopOptions: ShopWithAccounts[];
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function PurchaseDialog({
  open,
  mode,
  purchase,
  shopOptions,
  onClose,
  onSuccess,
}: PurchaseDialogProps) {
  const headingId = useId();
  const action =
    mode === 'create' ? createPurchaseAction : updatePurchaseAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  const [shopId, setShopId] = useState(purchase?.shopOfBuyId ?? '');

  const signature = `${open}-${mode}-${purchase?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setShopId(purchase?.shopOfBuyId ?? '');
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const accounts =
    shopOptions.find((s) => s.id === shopId)?.accounts ?? [];

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
            {mode === 'create' ? 'New purchase' : 'Edit purchase'}
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
          {mode === 'edit' && purchase ? (
            <input type="hidden" name="id" value={purchase.id} />
          ) : null}

          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-shop`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Shop
            </label>
            <select
              id={`${headingId}-shop`}
              name="shopOfBuyId"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-950 ${
                errors['shopOfBuyId']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <option value="">— Select a shop —</option>
              {shopOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors['shopOfBuyId'] ? (
              <p className="text-xs text-red-600">{errors['shopOfBuyId']}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-acc`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Buying account
            </label>
            <select
              id={`${headingId}-acc`}
              name="shoppingAccountId"
              defaultValue={purchase?.shoppingAccountId ?? ''}
              required
              disabled={!shopId}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm disabled:opacity-60 dark:bg-zinc-950 ${
                errors['shoppingAccountId']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <option value="">
                {shopId ? '— Select an account —' : 'Select a shop first'}
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            {errors['shoppingAccountId'] ? (
              <p className="text-xs text-red-600">
                {errors['shoppingAccountId']}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${headingId}-st`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Payment status
              </label>
              <select
                id={`${headingId}-st`}
                name="statusOfShopping"
                defaultValue={purchase?.statusOfShopping ?? 'No pagado'}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {PAY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Buy date"
              name="buyDate"
              type="date"
              defaultValue={isoToDateInput(purchase?.buyDate)}
              error={errors['buyDate']}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Card / ID (optional)"
              name="cardId"
              type="text"
              defaultValue={purchase?.cardId ?? ''}
            />
            <Field
              label="Total cost"
              name="totalCostOfPurchase"
              type="number"
              prefix="$"
              defaultValue={
                purchase?.totalCostOfPurchase.toString() ?? '0'
              }
              error={errors['totalCostOfPurchase']}
            />
          </div>

          <p className="text-xs text-zinc-500">
            Bought-products management (which updates each product&apos;s
            purchased amount and status) is handled separately.
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
  type: 'text' | 'number' | 'date';
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
