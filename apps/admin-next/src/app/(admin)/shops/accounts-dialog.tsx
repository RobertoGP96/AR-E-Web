'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  addBuyingAccountAction,
  renameBuyingAccountAction,
  deleteBuyingAccountAction,
} from './actions';
import type { ShopRow } from './schema';

interface AccountsDialogProps {
  shop: ShopRow | null;
  onClose: () => void;
}

export function AccountsDialog({ shop, onClose }: AccountsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!shop) return null;

  function handleAdd() {
    const name = newName.trim();
    if (!name || !shop) return;
    startTransition(async () => {
      const result = await addBuyingAccountAction(shop.id, name);
      if (result.ok) {
        toast.success('Cuenta añadida');
        setNewName('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRename(accountId: string, original: string) {
    const draft = drafts[accountId]?.trim();
    if (!draft || draft === original) return;
    startTransition(async () => {
      const result = await renameBuyingAccountAction(accountId, draft);
      if (result.ok) {
        toast.success('Cuenta renombrada');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(accountId: string) {
    startTransition(async () => {
      const result = await deleteBuyingAccountAction(accountId);
      if (result.ok) {
        toast.success('Cuenta eliminada');
        router.refresh();
      } else {
        toast.error(result.error);
      }
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
      <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <KeyRound className="h-4 w-4" aria-hidden />
              Cuentas de compra
            </h2>
            <p className="text-sm text-zinc-500">{shop.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {shop.accounts.length === 0 ? (
            <li className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Esta tienda no tiene cuentas de compra.
            </li>
          ) : (
            shop.accounts.map((account) => (
              <li key={account.id} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={100}
                  defaultValue={account.accountName}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [account.id]: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    handleRename(account.id, account.accountName)
                  }
                  className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {account.buysCount} compra{account.buysCount === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  disabled={isPending || account.buysCount > 0}
                  aria-label={`Eliminar ${account.accountName}`}
                  title={
                    account.buysCount > 0
                      ? 'No se puede eliminar: tiene compras'
                      : 'Eliminar cuenta'
                  }
                  className="shrink-0 rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <input
            type="text"
            maxLength={100}
            value={newName}
            placeholder="Nueva cuenta…"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
