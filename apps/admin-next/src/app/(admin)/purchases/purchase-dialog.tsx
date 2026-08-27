'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import {
  createPurchaseAction,
  updatePurchaseAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  Select,
  TextInput,
  SubmitButton,
} from '@/components/ui';
import {
  PAY_STATUSES,
  type PurchaseRow,
  type ShopWithAccounts,
} from './schema';

interface PurchaseDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  purchase?: PurchaseRow;
  shopOptions: ShopWithAccounts[];
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function PurchaseDialog({
  open,
  mode,
  purchase,
  shopOptions,
  onClose,
  onSuccess,
}: PurchaseDialogProps) {
  const action =
    mode === 'create' ? createPurchaseAction : updatePurchaseAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  // Dependent select: the account list follows the chosen shop.
  const [shopId, setShopId] = useState(purchase?.shopOfBuyId ?? '');

  const signature = `${open}-${mode}-${purchase?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setShopId(purchase?.shopOfBuyId ?? '');
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const accounts = shopOptions.find((s) => s.id === shopId)?.accounts ?? [];

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva compra' : 'Editar compra'}
      description={
        mode === 'create'
          ? 'Registra una compra en una tienda; los productos comprados se gestionan desde el detalle.'
          : `Compra #${purchase?.id ?? ''} en ${purchase?.shopName ?? ''}`
      }
      icon={<ShoppingBag className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (purchase?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && purchase ? (
          <input type="hidden" name="id" value={purchase.id} />
        ) : null}

        <Field label="Tienda" required error={errors['shopOfBuyId']}>
          <Select
            name="shopOfBuyId"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            required
            invalid={!!errors['shopOfBuyId']}
          >
            <option value="">— Selecciona una tienda —</option>
            {shopOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Cuenta de compra"
          required
          error={errors['shoppingAccountId']}
        >
          <Select
            name="shoppingAccountId"
            defaultValue={purchase?.shoppingAccountId ?? ''}
            required
            disabled={!shopId}
            invalid={!!errors['shoppingAccountId']}
            className="disabled:opacity-60"
          >
            <option value="">
              {shopId
                ? '— Selecciona una cuenta —'
                : 'Selecciona primero una tienda'}
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Estado de pago">
            <Select
              name="statusOfShopping"
              defaultValue={purchase?.statusOfShopping ?? 'No pagado'}
            >
              {PAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de compra" required error={errors['buyDate']}>
            <TextInput
              name="buyDate"
              type="date"
              required
              defaultValue={isoToDateInput(purchase?.buyDate)}
              invalid={!!errors['buyDate']}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tarjeta / ID (opcional)">
            <TextInput name="cardId" defaultValue={purchase?.cardId ?? ''} />
          </Field>
          <Field label="Costo total" error={errors['totalCostOfPurchase']}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <TextInput
                name="totalCostOfPurchase"
                type="number"
                step="0.01"
                min="0"
                defaultValue={purchase?.totalCostOfPurchase.toString() ?? '0'}
                invalid={!!errors['totalCostOfPurchase']}
                className="pl-7"
              />
            </div>
          </Field>
        </div>

        <p className="text-xs text-muted">
          La gestión de productos comprados (que actualiza la cantidad
          comprada y el estado de cada producto) se hace desde el detalle de
          la compra.
        </p>

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
