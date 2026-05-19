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
  createProductAction,
  updateProductAction,
  type ActionResult,
} from '../actions';
import { computeProductCost } from '@/lib/order-cost';
import { formatCurrency } from '@/lib/format';
import type { ProductRow, SelectOption } from '../schema';

interface ProductDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  orderId: string;
  product?: ProductRow;
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductDialog({
  open,
  mode,
  orderId,
  product,
  shopOptions,
  categoryOptions,
  onClose,
  onSuccess,
}: ProductDialogProps) {
  const headingId = useId();
  const action =
    mode === 'create' ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  // Live cost preview state.
  const [shopCost, setShopCost] = useState(product?.shopCost ?? 0);
  const [amount, setAmount] = useState(product?.amountRequested ?? 1);
  const [delivery, setDelivery] = useState(product?.shopDeliveryCost ?? 0);
  const [shopTaxes, setShopTaxes] = useState(product?.shopTaxes ?? 0);
  const [chargeIva, setChargeIva] = useState(product?.chargeIva ?? true);
  const [added, setAdded] = useState(product?.addedTaxes ?? 0);
  const [own, setOwn] = useState(product?.ownTaxes ?? 0);

  const signature = `${open}-${mode}-${product?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setShopCost(product?.shopCost ?? 0);
    setAmount(product?.amountRequested ?? 1);
    setDelivery(product?.shopDeliveryCost ?? 0);
    setShopTaxes(product?.shopTaxes ?? 0);
    setChargeIva(product?.chargeIva ?? true);
    setAdded(product?.addedTaxes ?? 0);
    setOwn(product?.ownTaxes ?? 0);
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const preview = computeProductCost({
    shopCost,
    amountRequested: amount,
    shopDeliveryCost: delivery,
    shopTaxes,
    chargeIva,
    addedTaxes: added,
    ownTaxes: own,
  });

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
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {mode === 'create' ? 'New product' : 'Edit product'}
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
          <input type="hidden" name="orderId" value={orderId} />
          {mode === 'edit' && product ? (
            <input type="hidden" name="productId" value={product.id} />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Text
              label="Name"
              name="name"
              defaultValue={product?.name ?? ''}
              error={errors['name']}
              required
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shop
              </label>
              <select
                name="shopId"
                defaultValue={product?.shopId ?? ''}
                onChange={(e) => {
                  const opt = shopOptions.find(
                    (s) => s.id === e.target.value
                  );
                  if (opt?.taxRate !== undefined) setShopTaxes(opt.taxRate);
                }}
                required
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-950 ${
                  errors['shopId']
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
              {errors['shopId'] ? (
                <p className="text-xs text-red-600">{errors['shopId']}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category (optional)
              </label>
              <select
                name="categoryId"
                defaultValue={product?.categoryId ?? ''}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">— None —</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Text
              label="Link (optional)"
              name="link"
              type="url"
              defaultValue={product?.link ?? ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Text
              label="SKU (optional)"
              name="sku"
              defaultValue={product?.sku ?? ''}
            />
            <Num
              label="Quantity"
              name="amountRequested"
              step="1"
              min="1"
              value={amount}
              onChange={(v) => setAmount(Math.max(1, Math.floor(v)))}
              error={errors['amountRequested']}
            />
            <Num
              label="Unit price"
              name="shopCost"
              prefix="$"
              value={shopCost}
              onChange={setShopCost}
              error={errors['shopCost']}
            />
          </div>

          <Text
            label="Description (optional)"
            name="description"
            defaultValue={product?.description ?? ''}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Num
              label="Delivery cost"
              name="shopDeliveryCost"
              prefix="$"
              value={delivery}
              onChange={setDelivery}
            />
            <Num
              label="Shop tax %"
              name="shopTaxes"
              value={shopTaxes}
              onChange={setShopTaxes}
            />
            <Num
              label="Added taxes"
              name="addedTaxes"
              prefix="$"
              value={added}
              onChange={setAdded}
            />
            <Num
              label="Own taxes"
              name="ownTaxes"
              prefix="$"
              value={own}
              onChange={setOwn}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="chargeIva"
              checked={chargeIva}
              onChange={(e) => setChargeIva(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              Apply 7% IVA
            </span>
          </label>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              <span>Base tax (IVA)</span>
              <span className="text-right tabular-nums">
                {formatCurrency(preview.baseTax)}
              </span>
              <span>Shop tax amount</span>
              <span className="text-right tabular-nums">
                {formatCurrency(preview.shopTaxAmount)}
              </span>
              <span>Added + own taxes</span>
              <span className="text-right tabular-nums">
                {formatCurrency(preview.addedTaxes + preview.ownTaxes)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2 text-sm font-semibold dark:border-zinc-700">
              <span>Total cost</span>
              <span className="tabular-nums">
                {formatCurrency(preview.totalCost)}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Recomputed and rounded server-side on save.
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

function Text({
  label,
  name,
  type = 'text',
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: 'text' | 'url';
  defaultValue?: string;
  error?: string;
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
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-zinc-950 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Num({
  label,
  name,
  value,
  onChange,
  error,
  prefix,
  step = '0.01',
  min = '0',
}: {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  prefix?: string;
  step?: string;
  min?: string;
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
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
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
