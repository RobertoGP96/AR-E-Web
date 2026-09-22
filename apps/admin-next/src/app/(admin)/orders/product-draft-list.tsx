'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button, Checkbox, Label } from '@heroui/react';
import { computeProductCost, round2 } from '@/lib/order-cost';
import { formatCurrency } from '@/lib/format';
import { Field, Select, TextInput } from '@/components/ui';
import type { ProductDraftInput, SelectOption } from './schema';

/** Fila editable de producto (estado del cliente antes de guardar). */
export interface ProductDraft extends Required<
  Omit<ProductDraftInput, 'link' | 'sku' | 'description'>
> {
  key: string;
  link: string;
  sku: string;
  description: string;
}

let seq = 0;
export function newDraft(defaults?: Partial<ProductDraft>): ProductDraft {
  seq += 1;
  return {
    key: `d${Date.now()}-${seq}`,
    name: '',
    shopId: '',
    categoryId: '',
    link: '',
    sku: '',
    description: '',
    amountRequested: 1,
    shopCost: 0,
    shopDeliveryCost: 0,
    shopTaxes: 0,
    chargeIva: true,
    addedTaxes: 0,
    ownTaxes: 0,
    ...defaults,
  };
}

export function draftCost(d: ProductDraft): number {
  return computeProductCost({
    shopCost: d.shopCost,
    amountRequested: d.amountRequested,
    shopDeliveryCost: d.shopDeliveryCost,
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    addedTaxes: d.addedTaxes,
    ownTaxes: d.ownTaxes,
  }).totalCost;
}

export function draftsTotal(drafts: ProductDraft[]): number {
  return round2(drafts.reduce((s, d) => s + draftCost(d), 0));
}

/** Lo mínimo para poder guardar: nombre, tienda, categoría, cantidad. */
export function draftIsComplete(d: ProductDraft): boolean {
  return d.name.trim().length > 0 && !!d.shopId && !!d.categoryId && d.amountRequested >= 1;
}

export function toDraftInput(d: ProductDraft): ProductDraftInput {
  return {
    name: d.name,
    shopId: d.shopId,
    categoryId: d.categoryId,
    link: d.link || undefined,
    sku: d.sku || undefined,
    description: d.description || undefined,
    amountRequested: d.amountRequested,
    shopCost: d.shopCost,
    shopDeliveryCost: d.shopDeliveryCost,
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    addedTaxes: d.addedTaxes,
    ownTaxes: d.ownTaxes,
  };
}

function MoneyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        $
      </span>
      <TextInput
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="pl-7"
      />
    </div>
  );
}

/**
 * Lista de productos editables en línea para crear una orden (o añadir
 * varios a una existente): cada fila es una tarjeta con los mismos
 * campos del diálogo de producto y su costo calculado en vivo.
 */
export function ProductDraftList({
  drafts,
  onChange,
  shopOptions,
  categoryOptions,
}: {
  drafts: ProductDraft[];
  onChange: (next: ProductDraft[]) => void;
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
}) {
  function update(key: string, patch: Partial<ProductDraft>) {
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }
  function remove(key: string) {
    onChange(drafts.filter((d) => d.key !== key));
  }
  function add() {
    // La nueva fila hereda tienda y categoría de la anterior.
    const last = drafts[drafts.length - 1];
    onChange([
      ...drafts,
      newDraft(
        last
          ? {
              shopId: last.shopId,
              categoryId: last.categoryId,
              shopTaxes: last.shopTaxes,
              chargeIva: last.chargeIva,
            }
          : undefined
      ),
    ]);
  }

  return (
    <div className="space-y-3">
      {drafts.map((d, index) => {
        const cost = draftCost(d);
        const complete = draftIsComplete(d);
        return (
          <section
            key={d.key}
            className={`surface-card space-y-3 p-4 ${complete ? '' : 'border-warning-soft-foreground/40'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Producto {index + 1}
                {!complete ? (
                  <span className="ml-2 text-xs font-normal text-warning-soft-foreground">
                    faltan datos
                  </span>
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(cost)}
                </span>
                {drafts.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={`Quitar producto ${index + 1}`}
                    onPress={() => remove(d.key)}
                    className="hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>

            <Field label="Nombre" required>
              <TextInput
                value={d.name}
                maxLength={100}
                onChange={(e) => update(d.key, { name: e.target.value })}
                placeholder="Título del producto en la tienda"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tienda" required>
                <Select
                  value={d.shopId}
                  onChange={(e) => {
                    const opt = shopOptions.find((s) => s.id === e.target.value);
                    update(d.key, {
                      shopId: e.target.value,
                      ...(opt?.taxRate !== undefined && { shopTaxes: opt.taxRate }),
                    });
                  }}
                >
                  <option value="">— Selecciona una tienda —</option>
                  {shopOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Categoría" required hint="Decide en qué bolsa cae al recibirse">
                <Select
                  value={d.categoryId}
                  onChange={(e) => update(d.key, { categoryId: e.target.value })}
                >
                  <option value="">— Selecciona una categoría —</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Cantidad">
                <TextInput
                  type="number"
                  step="1"
                  min="1"
                  inputMode="numeric"
                  value={d.amountRequested}
                  onChange={(e) =>
                    update(d.key, {
                      amountRequested: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    })
                  }
                />
              </Field>
              <Field label="Precio unitario">
                <MoneyInput value={d.shopCost} onChange={(v) => update(d.key, { shopCost: v })} />
              </Field>
              <Field label="Costo de envío">
                <MoneyInput
                  value={d.shopDeliveryCost}
                  onChange={(v) => update(d.key, { shopDeliveryCost: v })}
                />
              </Field>
              <Field label="Imp. tienda %">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={Number.isFinite(d.shopTaxes) ? d.shopTaxes : 0}
                  onChange={(e) => update(d.key, { shopTaxes: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <details className="group">
              <summary className="cursor-pointer select-none text-xs font-medium text-muted hover:text-foreground">
                Más datos (enlace, SKU, descripción, impuestos)
              </summary>
              <div className="mt-3 space-y-3">
                <Field label="Enlace (opcional)">
                  <TextInput
                    type="url"
                    value={d.link}
                    maxLength={200}
                    onChange={(e) => update(d.key, { link: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="SKU (opcional)">
                    <TextInput
                      value={d.sku}
                      maxLength={100}
                      onChange={(e) => update(d.key, { sku: e.target.value })}
                    />
                  </Field>
                  <Field label="Descripción (opcional)">
                    <TextInput
                      value={d.description}
                      maxLength={200}
                      onChange={(e) => update(d.key, { description: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="Imp. añadidos">
                    <MoneyInput value={d.addedTaxes} onChange={(v) => update(d.key, { addedTaxes: v })} />
                  </Field>
                  <Field label="Imp. propios">
                    <MoneyInput value={d.ownTaxes} onChange={(v) => update(d.key, { ownTaxes: v })} />
                  </Field>
                  <div className="flex items-end">
                    <Checkbox
                      isSelected={d.chargeIva}
                      onChange={(v) => update(d.key, { chargeIva: v })}
                      className="w-fit rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Label className="text-sm font-medium text-foreground">7% IVA</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </div>
              </div>
            </details>
          </section>
        );
      })}

      <Button variant="tertiary" onPress={add} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" aria-hidden />
        Añadir otro producto
      </Button>
    </div>
  );
}
