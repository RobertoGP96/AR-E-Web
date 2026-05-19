'use client';

import { useId, useState, useTransition } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createInvoiceAction,
  updateInvoiceAction,
} from './actions';
import {
  TAG_TYPES,
  computeTagSubtotal,
  type InvoiceRow,
  type TagType,
} from './schema';
import { formatCurrency } from '@/lib/format';

interface DraftTag {
  key: string;
  type: TagType;
  weight: string;
  costPerLb: string;
  fixedCost: string;
}

interface InvoiceDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  invoice?: InvoiceRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `tag-${keyCounter}`;
}

function emptyTag(): DraftTag {
  return {
    key: newKey(),
    type: 'pesaje',
    weight: '0',
    costPerLb: '0',
    fixedCost: '0',
  };
}

function toDraft(invoice?: InvoiceRow): DraftTag[] {
  if (!invoice || invoice.tags.length === 0) return [emptyTag()];
  return invoice.tags.map((t) => ({
    key: newKey(),
    type: t.type,
    weight: String(t.weight),
    costPerLb: String(t.costPerLb),
    fixedCost: String(t.fixedCost),
  }));
}

function draftSubtotal(t: DraftTag): number {
  return computeTagSubtotal({
    type: t.type,
    weight: Number(t.weight) || 0,
    costPerLb: Number(t.costPerLb) || 0,
    fixedCost: Number(t.fixedCost) || 0,
  });
}

export function InvoiceDialog({
  open,
  mode,
  invoice,
  onClose,
  onSuccess,
}: InvoiceDialogProps) {
  const headingId = useId();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(isoToDateInput(invoice?.date));
  const [tags, setTags] = useState<DraftTag[]>(() => toDraft(invoice));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [renderKey, setRenderKey] = useState(0);

  // Reset internal state whenever the dialog (re)opens for a target.
  const signature = `${open}-${mode}-${invoice?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setDate(isoToDateInput(invoice?.date));
    setTags(toDraft(invoice));
    setErrors({});
    setRenderKey((k) => k + 1);
  }

  if (!open) return null;

  const total =
    Math.round(tags.reduce((sum, t) => sum + draftSubtotal(t), 0) * 100) / 100;

  function updateTag(key: string, patch: Partial<DraftTag>) {
    setTags((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t))
    );
  }

  function submit() {
    setErrors({});
    const payload = {
      date,
      tags: tags.map((t) => ({
        type: t.type,
        weight: Number(t.weight) || 0,
        costPerLb: Number(t.costPerLb) || 0,
        fixedCost: Number(t.fixedCost) || 0,
      })),
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createInvoiceAction(payload)
          : await updateInvoiceAction(invoice!.id, payload);

      if (result.ok) {
        onSuccess();
      } else if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {mode === 'create' ? 'New invoice' : 'Edit invoice'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div key={renderKey} className="space-y-4 overflow-y-auto p-5">
          <div className="space-y-1">
            <label
              htmlFor={`${headingId}-date`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Date
            </label>
            <input
              id={`${headingId}-date`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full max-w-xs rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['date']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors['date'] ? (
              <p className="text-xs text-red-600">{errors['date']}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tags / concepts
              </h3>
              <button
                type="button"
                onClick={() => setTags((p) => [...p, emptyTag()])}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Plus className="h-3 w-3" aria-hidden />
                Add tag
              </button>
            </div>
            {errors['tags'] ? (
              <p className="text-xs text-red-600">{errors['tags']}</p>
            ) : null}

            <div className="space-y-3">
              {tags.map((tag, index) => (
                <div
                  key={tag.key}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTags((p) =>
                          p.length > 1
                            ? p.filter((t) => t.key !== tag.key)
                            : p
                        )
                      }
                      disabled={tags.length === 1}
                      aria-label="Remove tag"
                      className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-40 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="space-y-1">
                      <span className="text-xs text-zinc-500">Type</span>
                      <select
                        value={tag.type}
                        onChange={(e) =>
                          updateTag(tag.key, {
                            type: e.target.value as TagType,
                          })
                        }
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      >
                        {TAG_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>

                    {tag.type === 'pesaje' ? (
                      <>
                        <NumberCell
                          label="Weight (lb)"
                          value={tag.weight}
                          onChange={(v) => updateTag(tag.key, { weight: v })}
                          error={errors[`tags.${index}.weight`]}
                        />
                        <NumberCell
                          label="Cost / lb"
                          value={tag.costPerLb}
                          onChange={(v) =>
                            updateTag(tag.key, { costPerLb: v })
                          }
                          error={errors[`tags.${index}.costPerLb`]}
                        />
                        <NumberCell
                          label="Fixed cost"
                          value={tag.fixedCost}
                          onChange={(v) =>
                            updateTag(tag.key, { fixedCost: v })
                          }
                          error={errors[`tags.${index}.fixedCost`]}
                        />
                      </>
                    ) : (
                      <NumberCell
                        label="Fixed cost"
                        value={tag.fixedCost}
                        onChange={(v) =>
                          updateTag(tag.key, { fixedCost: v })
                        }
                        error={errors[`tags.${index}.fixedCost`]}
                      />
                    )}
                  </div>

                  <div className="mt-2 text-right text-xs text-zinc-500">
                    Subtotal:{' '}
                    <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(draftSubtotal(tag))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-5 dark:border-zinc-800">
          <div className="text-sm">
            Total:{' '}
            <span className="text-lg font-semibold tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberCell({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border bg-white px-2 py-1.5 text-sm dark:bg-zinc-950 ${
          error
            ? 'border-red-500'
            : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {error ? <p className="text-[10px] text-red-600">{error}</p> : null}
    </label>
  );
}
