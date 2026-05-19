'use client';

import { useId, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteDeliveryAction } from './actions';
import { formatCurrency } from '@/lib/format';
import type { DeliveryRow } from './schema';

interface DeleteDeliveryDialogProps {
  delivery: DeliveryRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteDeliveryDialog({
  delivery,
  onClose,
  onSuccess,
}: DeleteDeliveryDialogProps) {
  const headingId = useId();
  const [isPending, startTransition] = useTransition();

  if (!delivery) return null;

  function handleDelete() {
    if (!delivery) return;
    startTransition(async () => {
      const result = await deleteDeliveryAction(delivery.id);
      if (result.ok) onSuccess();
      else toast.error(result.error);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight">
          Delete delivery?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This will delete the{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {formatCurrency(delivery.weightCost)}
          </strong>{' '}
          delivery for {delivery.clientName} and recalculate their balance.
          Fails if it has linked delivered products.
        </p>
        <div className="mt-5 flex justify-end gap-2">
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
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
