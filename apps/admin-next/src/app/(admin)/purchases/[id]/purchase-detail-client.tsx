'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  addBuyedProductAction,
  removeBuyedProductAction,
  refundBuyedProductAction,
} from '../actions';
import { formatCurrency } from '@/lib/format';

interface BuyedProduct {
  id: string;
  productName: string;
  amountBuyed: number;
  quantityRefuned: number;
  isRefunded: boolean;
  refundAmount: number;
}

interface Candidate {
  id: string;
  name: string;
  pending: number;
}

interface PurchaseDetailClientProps {
  purchaseId: string;
  header: {
    shopName: string;
    accountName: string;
    status: string;
    totalCostOfPurchase: number;
  };
  buyedProducts: BuyedProduct[];
  candidates: Candidate[];
}

export function PurchaseDetailClient({
  purchaseId,
  header,
  buyedProducts,
  candidates,
}: PurchaseDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(1);
  const [refundTarget, setRefundTarget] = useState<BuyedProduct | null>(null);

  function handleAdd() {
    if (!productId) {
      toast.error('Select a product');
      return;
    }
    startTransition(async () => {
      const result = await addBuyedProductAction(
        purchaseId,
        productId,
        amount
      );
      if (result.ok) {
        toast.success('Product added to purchase');
        setProductId('');
        setAmount(1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(rowId: string) {
    startTransition(async () => {
      const result = await removeBuyedProductAction(purchaseId, rowId);
      if (result.ok) {
        toast.success('Product removed');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/purchases"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to purchases
      </Link>

      <header className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {header.shopName}
            </h1>
            <p className="text-sm text-zinc-500">{header.accountName}</p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {header.status}
            </span>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatCurrency(header.totalCostOfPurchase)}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add a product bought in this purchase
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No products from this shop available.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1">
              <span className="text-xs text-zinc-500">Product</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">— Select —</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.pending > 0 ? ` (${c.pending} pending)` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Amount</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                }
                className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !productId}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Bought</th>
              <th className="px-4 py-3 font-medium">Refunded</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {buyedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No products bought in this purchase yet.
                </td>
              </tr>
            ) : (
              buyedProducts.map((bp) => (
                <tr key={bp.id} className="text-zinc-800 dark:text-zinc-200">
                  <td className="px-4 py-3 font-medium">{bp.productName}</td>
                  <td className="px-4 py-3 tabular-nums">{bp.amountBuyed}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {bp.quantityRefuned > 0
                      ? `${bp.quantityRefuned} (${formatCurrency(bp.refundAmount)})`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setRefundTarget(bp)}
                        aria-label="Refund"
                        className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Undo2 className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(bp.id)}
                        disabled={isPending}
                        aria-label="Remove"
                        className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {refundTarget ? (
        <RefundDialog
          purchaseId={purchaseId}
          row={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            setRefundTarget(null);
            toast.success('Refund recorded');
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function RefundDialog({
  purchaseId,
  row,
  onClose,
  onSuccess,
}: {
  purchaseId: string;
  row: BuyedProduct;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(row.quantityRefuned || 1);
  const [amount, setAmount] = useState(row.refundAmount || 0);
  const [notes, setNotes] = useState('');

  function submit() {
    startTransition(async () => {
      const result = await refundBuyedProductAction(
        purchaseId,
        row.id,
        quantity,
        amount,
        notes
      );
      if (result.ok) onSuccess();
      else toast.error(result.error);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-tight">
          Refund — {row.productName}
        </h2>
        <p className="text-xs text-zinc-500">
          {row.amountBuyed} bought. Refunding reduces the product&apos;s
          purchased amount and may change its status.
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Quantity refunded</span>
          <input
            type="number"
            min={1}
            max={row.amountBuyed}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(
                    row.amountBuyed,
                    Math.floor(Number(e.target.value) || 1)
                  )
                )
              )
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Refund amount ($)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Notes (optional)</span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? 'Saving…' : 'Record refund'}
          </button>
        </div>
      </div>
    </div>
  );
}
