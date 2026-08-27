'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Checkbox, Label } from '@heroui/react';
import {
  createProductAction,
  updateProductAction,
  type ActionResult,
} from '../actions';
import { computeProductCost } from '@/lib/order-cost';
import { formatCurrency } from '@/lib/format';
import {
  AppModal,
  Field,
  Select,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import type { ProductRow, SelectOption } from '../schema';

interface ProductDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  orderId: string;
  product?: ProductRow;
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductDialog({
  open,
  mode,
  orderId,
  product,
  shopOptions,
  categoryOptions,
  onClose,
  onSuccess,
}: ProductDialogProps) {
  const action = mode === 'create' ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  // Live cost preview state.
  const [shopCost, setShopCost] = useState(product?.shopCost ?? 0);
  const [amount, setAmount] = useState(product?.amountRequested ?? 1);
  const [delivery, setDelivery] = useState(product?.shopDeliveryCost ?? 0);
  const [shopTaxes, setShopTaxes] = useState(product?.shopTaxes ?? 0);
  const [chargeIva, setChargeIva] = useState(product?.chargeIva ?? true);
  const [added, setAdded] = useState(product?.addedTaxes ?? 0);
  const [own, setOwn] = useState(product?.ownTaxes ?? 0);

  const signature = `${open}-${mode}-${product?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setShopCost(product?.shopCost ?? 0);
    setAmount(product?.amountRequested ?? 1);
    setDelivery(product?.shopDeliveryCost ?? 0);
    setShopTaxes(product?.shopTaxes ?? 0);
    setChargeIva(product?.chargeIva ?? true);
    setAdded(product?.addedTaxes ?? 0);
    setOwn(product?.ownTaxes ?? 0);
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const preview = computeProductCost({
    shopCost,
    amountRequested: amount,
    shopDeliveryCost: delivery,
    shopTaxes,
    chargeIva,
    addedTaxes: added,
    ownTaxes: own,
  });

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
      description="La cascada de costos se recalcula en el servidor al guardar."
      icon={<PackagePlus className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (product?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        <input type="hidden" name="orderId" value={orderId} />
        {mode === 'edit' && product ? (
          <input type="hidden" name="productId" value={product.id} />
        ) : null}

        {/* El nombre ocupa todo el ancho: suele ser largo (títulos de
            Shein/Amazon) y no debe compartir fila con otro campo. */}
        <Field label="Nombre" required error={errors['name']}>
          <TextInput
            name="name"
            defaultValue={product?.name ?? ''}
            required
            invalid={!!errors['name']}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tienda" required error={errors['shopId']}>
            <Select
              name="shopId"
              defaultValue={product?.shopId ?? ''}
              required
              invalid={!!errors['shopId']}
              onChange={(e) => {
                const opt = shopOptions.find((s) => s.id === e.target.value);
                if (opt?.taxRate !== undefined) setShopTaxes(opt.taxRate);
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
          <Field label="Categoría (opcional)">
            <Select
              name="categoryId"
              defaultValue={product?.categoryId ?? ''}
            >
              <option value="">— Ninguna —</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Enlace (opcional)">
          <TextInput name="link" type="url" defaultValue={product?.link ?? ''} />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="SKU (opcional)">
            <TextInput name="sku" defaultValue={product?.sku ?? ''} />
          </Field>
          <Field label="Cantidad" error={errors['amountRequested']}>
            <TextInput
              name="amountRequested"
              type="number"
              step="1"
              min="1"
              value={Number.isFinite(amount) ? amount : 1}
              onChange={(e) =>
                setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))
              }
              invalid={!!errors['amountRequested']}
            />
          </Field>
          <Field label="Precio unitario" error={errors['shopCost']}>
            <MoneyInput
              name="shopCost"
              value={shopCost}
              onChange={setShopCost}
              invalid={!!errors['shopCost']}
            />
          </Field>
        </div>

        <Field label="Descripción (opcional)">
          <TextInput
            name="description"
            defaultValue={product?.description ?? ''}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Costo de envío">
            <MoneyInput
              name="shopDeliveryCost"
              value={delivery}
              onChange={setDelivery}
            />
          </Field>
          <Field label="Imp. tienda %">
            <TextInput
              name="shopTaxes"
              type="number"
              step="0.01"
              min="0"
              value={Number.isFinite(shopTaxes) ? shopTaxes : 0}
              onChange={(e) => setShopTaxes(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Imp. añadidos">
            <MoneyInput name="addedTaxes" value={added} onChange={setAdded} />
          </Field>
          <Field label="Imp. propios">
            <MoneyInput name="ownTaxes" value={own} onChange={setOwn} />
          </Field>
        </div>

        <Checkbox
          name="chargeIva"
          isSelected={chargeIva}
          onChange={setChargeIva}
          className="w-fit rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label className="text-sm font-medium text-foreground">
              Aplicar 7% de IVA
            </Label>
          </Checkbox.Content>
        </Checkbox>

        <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
            <span>Impuesto base (IVA)</span>
            <span className="text-right tabular-nums">
              {formatCurrency(preview.baseTax)}
            </span>
            <span>Impuesto de tienda</span>
            <span className="text-right tabular-nums">
              {formatCurrency(preview.shopTaxAmount)}
            </span>
            <span>Impuestos añadidos + propios</span>
            <span className="text-right tabular-nums">
              {formatCurrency(preview.addedTaxes + preview.ownTaxes)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-accent/20 pt-2 text-sm font-bold text-foreground">
            <span>Costo total</span>
            <span className="tabular-nums">
              {formatCurrency(preview.totalCost)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Se recalcula y redondea en el servidor al guardar.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <SubmitButton isPending={isPending}>Guardar</SubmitButton>
        </div>
      </form>
    </AppModal>
  );
}

function MoneyInput({
  name,
  value,
  onChange,
  invalid,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        $
      </span>
      <TextInput
        name={name}
        type="number"
        step="0.01"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        invalid={invalid}
        className="pl-7"
      />
    </div>
  );
}
