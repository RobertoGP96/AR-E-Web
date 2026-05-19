'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { BalanceDialog } from './balance-dialog';
import { DeleteBalanceDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BalanceRow } from './schema';

interface BalanceClientProps {
  initialRows: BalanceRow[];
}

function profit(row: BalanceRow): number {
  return row.revenues - row.buysCosts - row.costs - row.expenses;
}

export function BalanceClient({ initialRows }: BalanceClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BalanceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BalanceRow | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Scale className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Balance</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Period-based reconciliation of revenue, costs, weight and
              expenses.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New balance
        </button>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Weight (sys / reg)</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Buys</th>
                <th className="px-4 py-3 font-medium">Costs</th>
                <th className="px-4 py-3 font-medium">Expenses</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    No balances yet.
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => {
                  const p = profit(row);
                  return (
                    <tr
                      key={row.id}
                      className="text-zinc-800 dark:text-zinc-200"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {formatDate(row.startDate)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          → {formatDate(row.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.systemWeight.toFixed(2)} /{' '}
                        {row.registeredWeight.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatCurrency(row.revenues)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-500">
                        {formatCurrency(row.buysCosts)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-500">
                        {formatCurrency(row.costs)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-500">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td
                        className={`px-4 py-3 tabular-nums font-medium ${
                          p >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(p)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditTarget(row)}
                            aria-label="Edit balance"
                            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            aria-label="Delete balance"
                            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-800">
          {initialRows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              No balances yet.
            </li>
          ) : (
            initialRows.map((row) => {
              const p = profit(row);
              return (
                <li key={row.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {formatDate(row.startDate)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        → {formatDate(row.endDate)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTarget(row)}
                        aria-label="Edit balance"
                        className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        aria-label="Delete balance"
                        className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <dt>Revenue</dt>
                    <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(row.revenues)}
                    </dd>
                    <dt>Profit</dt>
                    <dd
                      className={`text-right tabular-nums font-medium ${
                        p >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(p)}
                    </dd>
                  </dl>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <BalanceDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Balance created');
          router.refresh();
        }}
      />

      <BalanceDialog
        open={editTarget !== null}
        mode="edit"
        balance={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Balance updated');
          router.refresh();
        }}
      />

      <DeleteBalanceDialog
        balance={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Balance deleted');
          router.refresh();
        }}
      />
    </div>
  );
}
