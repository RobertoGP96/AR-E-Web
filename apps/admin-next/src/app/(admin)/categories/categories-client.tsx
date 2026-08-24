'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Tag, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CategoryRow } from './schema';

interface CategoriesClientProps {
  initialRows: CategoryRow[];
  initialQuery: string;
}

export function CategoriesClient({
  initialRows,
  initialQuery,
}: CategoriesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  function applyQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('q', next);
    else params.delete('q');
    startTransition(() => {
      router.replace(`/categories?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          <Tag className="h-8 w-8 text-orange-400" aria-hidden />
          Categorías
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona las categorías de productos y su costo de envío por libra
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Buscar por nombre…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyQuery(query);
            }}
            onBlur={() => {
              if (query !== initialQuery) applyQuery(query);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva categoría
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Costo / lb</th>
                <th className="px-4 py-3 font-medium">Cargo al cliente / lb</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Cargando…' : 'No hay categorías.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row, index) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrency(row.shippingCostPerPound)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrency(row.clientShippingCharge)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label={`Edit ${row.name}`}
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label={`Delete ${row.name}`}
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
              {isPending ? 'Cargando…' : 'No hay categorías.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{row.name}</div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(row)}
                      aria-label={`Edit ${row.name}`}
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Delete ${row.name}`}
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <dt>Costo / lb</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(row.shippingCostPerPound)}
                  </dd>
                  <dt>Cargo al cliente / lb</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(row.clientShippingCharge)}
                  </dd>
                  <dt>Creado</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatDate(row.createdAt)}
                  </dd>
                </dl>
              </li>
            ))
          )}
        </ul>
      </div>

      <CategoryDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Categoría creada');
          router.refresh();
        }}
      />

      <CategoryDialog
        open={editTarget !== null}
        mode="edit"
        category={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Categoría actualizada');
          router.refresh();
        }}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Categoría eliminada');
          router.refresh();
        }}
      />
    </div>
  );
}
