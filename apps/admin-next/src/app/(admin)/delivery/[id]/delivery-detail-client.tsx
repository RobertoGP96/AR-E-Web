'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  addDeliveredProductAction,
  removeDeliveredProductAction,
} from '../actions';
import { formatCurrency } from '@/lib/format';

interface DeliveredProduct {
  id: string;
  productName: string;
  amountDelivered: number;
}

interface Candidate {
  id: string;
  name: string;
  remaining: number;
}

interface DeliveryDetailClientProps {
  deliveryId: string;
  header: {
    clientName: string;
    categoryName: string | null;
    weight: number;
    status: string;
    paymentStatus: string;
    weightCost: number;
    managerProfit: number;
  };
  deliveredProducts: DeliveredProduct[];
  candidates: Candidate[];
}

export function DeliveryDetailClient({
  deliveryId,
  header,
  deliveredProducts,
  candidates,
}: DeliveryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(1);

  const selected = candidates.find((c) => c.id === productId);
  const maxAmount = selected?.remaining ?? 0;

  function handleAdd() {
    if (!productId) {
      toast.error('Select a product');
      return;
    }
    startTransition(async () => {
      const result = await addDeliveredProductAction(
        deliveryId,
        productId,
        amount
      );
      if (result.ok) {
        toast.success('Product added to delivery');
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
      const result = await removeDeliveredProductAction(deliveryId, rowId);
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
        href="/delivery"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to deliveries
      </Link>

      <header className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {header.clientName}
            </h1>
            <p className="text-sm text-zinc-500">
              {header.weight.toFixed(2)} lb
              {header.categoryName ? ` · ${header.categoryName}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {header.status}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {header.paymentStatus}
            </span>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Weight cost
            </dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatCurrency(header.weightCost)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Manager profit
            </dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatCurrency(header.managerProfit)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add a received product to this delivery
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No received-but-undelivered products for this client.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1">
              <span className="text-xs text-zinc-500">Product</span>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setAmount(1);
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">— Select —</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.remaining} available)
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Amount</span>
              <input
                type="number"
                min={1}
                max={maxAmount || 1}
                value={amount}
                onChange={(e) =>
                  setAmount(
                    Math.max(
                      1,
                      Math.min(
                        maxAmount || 1,
                        Math.floor(Number(e.target.value) || 1)
                      )
                    )
                  )
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
              <th className="px-4 py-3 font-medium">Delivered</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {deliveredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No products delivered in this receipt yet.
                </td>
              </tr>
            ) : (
              deliveredProducts.map((dp) => (
                <tr key={dp.id} className="text-zinc-800 dark:text-zinc-200">
                  <td className="px-4 py-3 font-medium">{dp.productName}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {dp.amountDelivered}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(dp.id)}
                      disabled={isPending}
                      aria-label="Remove"
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
