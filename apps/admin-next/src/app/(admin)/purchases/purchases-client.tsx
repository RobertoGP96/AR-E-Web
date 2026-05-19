'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseDialog } from './purchase-dialog';
import { DeletePurchaseDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PAY_STATUSES,
  type PayStatus,
  type PurchaseRow,
  type ShopWithAccounts,
} from './schema';

interface PurchasesClientProps {
  initialRows: PurchaseRow[];
  shopOptions: ShopWithAccounts[];
  initialStatus: PayStatus | null;
}

export function PurchasesClient({
  initialRows,
  shopOptions,
  initialStatus,
}: PurchasesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRow | null>(null);

  function setStatus(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('status', value);
    else params.delete('status');
    startTransition(() => {
      router.replace(`/purchases?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Shopping receipts per buying account and shop.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New purchase
        </button>
      </header>

      <div>
        <select
          value={initialStatus ?? ''}
          onChange={(e) => setStatus(e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">All payment states</option>
          {PAY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Loading…' : 'No purchases found.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.buyDate)}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.shopName}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.accountName}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.productCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.statusOfShopping}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {formatCurrency(row.totalCostOfPurchase)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label="Edit purchase"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Delete purchase"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
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

        <ul className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-800">
          {initialRows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              {isPending ? 'Loading…' : 'No purchases found.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{row.shopName}</div>
                    <div className="text-xs text-zinc-500">
                      {row.accountName} · {formatDate(row.buyDate)}
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(row.totalCostOfPurchase)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {row.statusOfShopping}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditTarget(row)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-red-600 dark:border-zinc-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <PurchaseDialog
        open={createOpen}
        mode="create"
        shopOptions={shopOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Purchase created');
          router.refresh();
        }}
      />

      <PurchaseDialog
        open={editTarget !== null}
        mode="edit"
        purchase={editTarget ?? undefined}
        shopOptions={shopOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Purchase updated');
          router.refresh();
        }}
      />

      <DeletePurchaseDialog
        purchase={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Purchase deleted');
          router.refresh();
        }}
      />
    </div>
  );
}
