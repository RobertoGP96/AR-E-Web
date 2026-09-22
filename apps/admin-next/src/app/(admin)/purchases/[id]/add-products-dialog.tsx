'use client';

import { useMemo, useState, useTransition } from 'react';
import { PackagePlus } from 'lucide-react';
import { Button, Checkbox, Label, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { estimateBuyedCost, round2 } from '@/lib/order-cost';
import {
  pickedItems,
  pruneSelection,
  summarize,
  type ChecklistGroup,
  type ChecklistSelection,
} from '@/lib/product-checklist';
import { ProductChecklist } from '@/components/product-checklist';
import { AppModal } from '@/components/ui';
import { addPurchaseItemsAction } from '../actions';
import type { PendingCandidates, PendingProduct } from '../schema';

/**
 * Añadir productos pendientes (de la tienda de la compra) a una compra
 * existente con el mismo checklist de /purchases/new.
 */
export function AddProductsDialog({
  open,
  purchaseId,
  shopName,
  candidates,
  onClose,
  onSuccess,
}: {
  open: boolean;
  purchaseId: string;
  shopName: string;
  candidates: PendingCandidates;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rawSelection, setSelection] = useState<ChecklistSelection>({});
  const [addToTotal, setAddToTotal] = useState(true);

  const productsById = useMemo(() => {
    const map = new Map<string, PendingProduct>();
    for (const g of candidates.groups) for (const p of g.products) map.set(p.id, p);
    return map;
  }, [candidates]);

  const groups: ChecklistGroup[] = useMemo(
    () =>
      candidates.groups.map((g) => ({
        id: g.clientId,
        label: g.clientName,
        hint: g.phoneNumber,
        items: g.products.map((p) => ({
          id: p.id,
          name: p.name,
          max: p.pending,
          subtitle: `Orden #${p.orderId}${p.sku ? ` · ${p.sku}` : ''}`,
          meta: `Pendientes ${p.pending} de ${p.amountRequested} pedidas`,
        })),
      })),
    [candidates]
  );
  const selection = useMemo(
    () => pruneSelection(rawSelection, groups),
    [rawSelection, groups]
  );
  const summary = useMemo(() => summarize(groups, selection), [groups, selection]);
  const estimateOf = (id: string, qty: number) => {
    const p = productsById.get(id);
    return p ? estimateBuyedCost(p.cost, qty) : 0;
  };
  const estimate = round2(
    Object.entries(selection).reduce((s, [id, q]) => s + estimateOf(id, q), 0)
  );

  function submit() {
    const items = pickedItems(selection);
    if (items.length === 0) {
      toast.error('Sin productos marcados', {
        description: 'Marca al menos un producto pendiente.',
      });
      return;
    }
    startTransition(async () => {
      const result = await addPurchaseItemsAction({
        purchaseId,
        items,
        addToTotal,
      });
      if (result.ok) {
        setSelection({});
        toast.success('Productos añadidos', {
          description: `${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'}${
            addToTotal ? ` · +${formatCurrency(estimate)} al total` : ''
          }.`,
        });
        onSuccess();
      } else {
        toast.error('No se pudieron añadir los productos', {
          description: result.error,
        });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Añadir productos"
      description={`Productos encargados pendientes de comprar en ${shopName}.`}
      icon={<PackagePlus className="h-5 w-5" aria-hidden />}
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {summary.items} producto{summary.items === 1 ? '' : 's'} ·{' '}
              {summary.units} unidad{summary.units === 1 ? '' : 'es'} · est.{' '}
              {formatCurrency(estimate)}
            </p>
            <Checkbox
              isSelected={addToTotal}
              onChange={setAddToTotal}
              className="mt-1"
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label className="text-xs text-muted">
                  Sumar el estimado al costo total de la compra
                </Label>
              </Checkbox.Content>
            </Checkbox>
          </div>
          <div className="flex gap-2">
            <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onPress={submit}
              isDisabled={isPending || summary.units === 0}
            >
              {isPending ? <Spinner size="sm" color="current" aria-hidden /> : null}
              Añadir
            </Button>
          </div>
        </div>
      }
    >
      <ProductChecklist
        groups={groups}
        value={selection}
        onChange={setSelection}
        emptyMessage={`No hay productos encargados pendientes de comprar en ${shopName}.`}
        renderItemExtra={(item, qty) => (
          <span className="text-xs text-muted">
            Estimado:{' '}
            <b className="tabular-nums text-foreground">
              {formatCurrency(estimateOf(item.id, qty))}
            </b>
          </span>
        )}
      />
    </AppModal>
  );
}
