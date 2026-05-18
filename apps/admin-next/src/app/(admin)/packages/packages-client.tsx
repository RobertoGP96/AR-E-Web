'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Box, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PackageDialog } from './package-dialog';
import { DeletePackageDialog } from './delete-dialog';
import { setPackageStatusAction } from './actions';
import { formatDate } from '@/lib/format';
import { PACKAGE_STATUSES, type PackageRow, type PackageStatus } from './schema';

interface PackagesClientProps {
  initialRows: PackageRow[];
  initialQuery: string;
  initialStatus: PackageStatus | null;
}

const STATUS_STYLES: Record<PackageStatus, string> = {
  Enviado:
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Recibido:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Procesado:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function PackagesClient({
  initialRows,
  initialQuery,
  initialStatus,
}: PackagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function applyParams(nextQuery: string, nextStatus: PackageStatus | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery) params.set('q', nextQuery);
    else params.delete('q');
    if (nextStatus) params.set('status', nextStatus);
    else params.delete('status');
    startTransition(() => {
      router.replace(`/packages?${params.toString()}`);
    });
  }

  function handleStatusChange(row: PackageRow, status: PackageStatus) {
    if (row.statusOfProcessing === status) return;
    setUpdatingId(row.id);
    startTransition(async () => {
      const result = await setPackageStatusAction(row.id, status);
      setUpdatingId(null);
      if (result.ok) {
        toast.success(`Package status updated to ${status}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Box className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paquetes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track incoming packages from shipping agencies.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              placeholder="Search agency or tracking…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyParams(query, initialStatus);
              }}
              onBlur={() => {
                if (query !== initialQuery) applyParams(query, initialStatus);
              }}
              className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
            />
          </label>
          <select
            value={initialStatus ?? ''}
            onChange={(e) => {
              const next = e.target.value as PackageStatus | '';
              applyParams(query, next === '' ? null : next);
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
          >
            <option value="">All statuses</option>
            {PACKAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New package
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tracking</th>
                <th className="px-4 py-3 font-medium">Agency</th>
                <th className="px-4 py-3 font-medium">Arrival</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Loading…' : 'No packages found.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.numberOfTracking}
                    </td>
                    <td className="px-4 py-3">{row.agencyName}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.arrivalDate)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.statusOfProcessing}
                        onChange={(e) =>
                          handleStatusChange(
                            row,
                            e.target.value as PackageStatus
                          )
                        }
                        disabled={updatingId === row.id}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-60 ${STATUS_STYLES[row.statusOfProcessing]}`}
                      >
                        {PACKAGE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label={`Edit ${row.numberOfTracking}`}
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label={`Delete ${row.numberOfTracking}`}
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
              {isPending ? 'Loading…' : 'No packages found.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs">
                      {row.numberOfTracking}
                    </div>
                    <div className="text-sm font-medium">{row.agencyName}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(row)}
                      aria-label={`Edit ${row.numberOfTracking}`}
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Delete ${row.numberOfTracking}`}
                      className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <dt>Arrival</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatDate(row.arrivalDate)}
                  </dd>
                  <dt>Status</dt>
                  <dd className="text-right">
                    <select
                      value={row.statusOfProcessing}
                      onChange={(e) =>
                        handleStatusChange(row, e.target.value as PackageStatus)
                      }
                      disabled={updatingId === row.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-60 ${STATUS_STYLES[row.statusOfProcessing]}`}
                    >
                      {PACKAGE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </dd>
                </dl>
              </li>
            ))
          )}
        </ul>
      </div>

      <PackageDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Package created');
          router.refresh();
        }}
      />

      <PackageDialog
        open={editTarget !== null}
        mode="edit"
        pkg={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Package updated');
          router.refresh();
        }}
      />

      <DeletePackageDialog
        pkg={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Package deleted');
          router.refresh();
        }}
      />
    </div>
  );
}
