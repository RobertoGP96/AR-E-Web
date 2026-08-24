'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDialog } from './invoice-dialog';
import { DeleteInvoiceDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import type { InvoiceRow } from './schema';

interface InvoicesClientProps {
  initialRows: InvoiceRow[];
}

export function InvoicesClient({ initialRows }: InvoicesClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvoiceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <FileText className="h-8 w-8 text-orange-400" aria-hidden />
            Costos de Envío
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona los costos de envío del sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva factura
        </button>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 font-mono text-xs">#{row.id}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.tags.length} tag
                        {row.tags.length === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label="Editar factura"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Eliminar factura"
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
              No invoices yet.
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-zinc-500">
                      #{row.id}
                    </div>
                    <div className="text-sm">{formatDate(row.date)}</div>
                    <div className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.total)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(row)}
                      aria-label="Editar factura"
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      aria-label="Eliminar factura"
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {row.tags.length} tag{row.tags.length === 1 ? '' : 's'}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <InvoiceDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Factura creada');
          router.refresh();
        }}
      />

      <InvoiceDialog
        open={editTarget !== null}
        mode="edit"
        invoice={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Factura actualizada');
          router.refresh();
        }}
      />

      <DeleteInvoiceDialog
        invoice={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Factura eliminada');
          router.refresh();
        }}
      />
    </div>
  );
}
