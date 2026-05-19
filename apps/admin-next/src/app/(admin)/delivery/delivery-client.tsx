'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DeliveryDialog } from './delivery-dialog';
import { DeleteDeliveryDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  DELIVERY_STATUSES,
  type CategoryOption,
  type ClientOption,
  type DeliveryRow,
  type DeliveryStatus,
} from './schema';

interface DeliveryClientProps {
  initialRows: DeliveryRow[];
  clientOptions: ClientOption[];
  categoryOptions: CategoryOption[];
  initialFilters: { q: string; status: DeliveryStatus | null };
}

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  Pendiente:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'En transito':
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Entregado:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Fallida: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function DeliveryClient({
  initialRows,
  clientOptions,
  categoryOptions,
  initialFilters,
}: DeliveryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialFilters.q);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeliveryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRow | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`/delivery?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Truck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Delivery receipts, weight cost and payment status.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New delivery
        </button>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Search client…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', query || null);
            }}
            onBlur={() => {
              if (query !== initialFilters.q) setParam('q', query || null);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
          />
        </label>
        <select
          value={initialFilters.status ?? ''}
          onChange={(e) => setParam('status', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">All statuses</option>
          {DELIVERY_STATUSES.map((s) => (
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
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pay</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Loading…' : 'No deliveries found.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <Link
                        href={`/delivery/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.categoryName ?? (
                        <span className="italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.weight.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {formatCurrency(row.weightCost)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">
                      {formatCurrency(row.managerProfit)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.paymentStatus}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.deliverDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Link
                          href={`/delivery/${row.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label="Edit delivery"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Delete delivery"
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
              {isPending ? 'Loading…' : 'No deliveries found.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{row.clientName}</div>
                    <div className="text-xs text-zinc-500">
                      {row.weight.toFixed(2)} lb ·{' '}
                      {formatDate(row.deliverDate)}
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(row.weightCost)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {row.paymentStatus}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
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
              </li>
            ))
          )}
        </ul>
      </div>

      <DeliveryDialog
        open={createOpen}
        mode="create"
        clientOptions={clientOptions}
        categoryOptions={categoryOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Delivery created');
          router.refresh();
        }}
      />

      <DeliveryDialog
        open={editTarget !== null}
        mode="edit"
        delivery={editTarget ?? undefined}
        clientOptions={clientOptions}
        categoryOptions={categoryOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Delivery updated');
          router.refresh();
        }}
      />

      <DeleteDeliveryDialog
        delivery={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Delivery deleted');
          router.refresh();
        }}
      />
    </div>
  );
}
