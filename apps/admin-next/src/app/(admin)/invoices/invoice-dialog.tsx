'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Spinner, Tooltip } from '@heroui/react';
import { createInvoiceAction, updateInvoiceAction } from './actions';
import {
  TAG_TYPES,
  computeTagSubtotal,
  type InvoiceRow,
  type TagType,
} from './schema';
import { formatCurrency } from '@/lib/format';
import { AppModal, Field, TextInput, Select } from '@/components/ui';

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

const TAG_TYPE_LABELS: Record<TagType, string> = {
  pesaje: 'Pesaje',
  nominal: 'Nominal',
};

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
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva factura' : 'Editar factura'}
      description={
        mode === 'create'
          ? 'Registra una factura de costos de envío con sus conceptos.'
          : `Factura #${invoice?.id ?? ''}`
      }
      icon={<FileText className="h-5 w-5" aria-hidden />}
      size="lg"
      footer={
        <>
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onPress={submit} isDisabled={isPending}>
            {isPending ? (
              <>
                <Spinner size="sm" aria-hidden />
                Guardando…
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </>
      }
    >
      <div key={renderKey} className="space-y-4">
        <Field label="Fecha" required error={errors['date']} className="max-w-xs">
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            invalid={!!errors['date']}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="field-label">Conceptos</h3>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setTags((p) => [...p, emptyTag()])}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Añadir concepto
            </Button>
          </div>
          {errors['tags'] ? (
            <p role="alert" className="text-xs font-medium text-danger">
              {errors['tags']}
            </p>
          ) : null}

          <div className="stagger-children space-y-2.5">
            {tags.map((tag, index) => (
              <div key={tag.key} className="surface-card p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Concepto #{index + 1}
                  </span>
                  <Tooltip delay={500}>
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      aria-label="Quitar concepto"
                      isDisabled={tags.length === 1}
                      onPress={() =>
                        setTags((p) =>
                          p.length > 1
                            ? p.filter((t) => t.key !== tag.key)
                            : p
                        )
                      }
                      className="hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Tooltip.Content>Quitar concepto</Tooltip.Content>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Tipo</span>
                    <Select
                      value={tag.type}
                      onChange={(e) =>
                        updateTag(tag.key, {
                          type: e.target.value as TagType,
                        })
                      }
                    >
                      {TAG_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TAG_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </Select>
                  </label>

                  {tag.type === 'pesaje' ? (
                    <>
                      <NumberCell
                        label="Peso (lb)"
                        value={tag.weight}
                        onChange={(v) => updateTag(tag.key, { weight: v })}
                        error={errors[`tags.${index}.weight`]}
                      />
                      <NumberCell
                        label="Costo / lb"
                        value={tag.costPerLb}
                        onChange={(v) =>
                          updateTag(tag.key, { costPerLb: v })
                        }
                        error={errors[`tags.${index}.costPerLb`]}
                      />
                      <NumberCell
                        label="Costo fijo"
                        value={tag.fixedCost}
                        onChange={(v) =>
                          updateTag(tag.key, { fixedCost: v })
                        }
                        error={errors[`tags.${index}.fixedCost`]}
                      />
                    </>
                  ) : (
                    <NumberCell
                      label="Costo fijo"
                      value={tag.fixedCost}
                      onChange={(v) =>
                        updateTag(tag.key, { fixedCost: v })
                      }
                      error={errors[`tags.${index}.fixedCost`]}
                    />
                  )}
                </div>

                <div className="mt-2 text-right text-xs text-muted">
                  Subtotal:{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(draftSubtotal(tag))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
            {tags.map((tag, index) => (
              <div key={tag.key} className="contents">
                <span>
                  Concepto #{index + 1} · {TAG_TYPE_LABELS[tag.type]}
                </span>
                <span className="text-right tabular-nums">
                  {formatCurrency(draftSubtotal(tag))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-accent/20 pt-2 text-sm font-bold">
            <span className="text-foreground">Total de la factura</span>
            <span className="tabular-nums text-success-soft-foreground">
              {formatCurrency(total)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            El total se recalcula y redondea en el servidor al guardar.
          </p>
        </div>
      </div>
    </AppModal>
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
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <TextInput
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={!!error}
      />
      {error ? (
        <span role="alert" className="block text-[10px] font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
