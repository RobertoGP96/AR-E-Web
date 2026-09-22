'use client';

import { useMemo, useState, useTransition } from 'react';
import { PackagePlus, Scale } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { round2 } from '@/lib/order-cost';
import { describeBags } from '@/lib/open-bags';
import {
  pickedItems,
  pruneSelection,
  summarize,
  type ChecklistGroup,
  type ChecklistSelection,
} from '@/lib/product-checklist';
import { ProductChecklist } from '@/components/product-checklist';
import { AppModal, Field, SearchSelect, TextInput } from '@/components/ui';
import { assembleDeliveryAction, listReceivedForClientAction } from './actions';
import type { ClientOption, ReceivedCandidate } from './schema';

/**
 * «Armar entrega desde recibidos» (ADR-0004): cliente → checklist de sus
 * productos recibidos sin entregar agrupados por categoría → llena la
 * bolsa de cada categoría; con una sola categoría se puede pesar en el
 * mismo paso.
 */
export function AssembleDeliveryDialog({
  open,
  clientOptions,
  onClose,
}: {
  open: boolean;
  clientOptions: ClientOption[];
  onClose: () => void;
}) {
  const [isLoading, startLoading] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<ReceivedCandidate[] | null>(null);
  const [rawSelection, setSelection] = useState<ChecklistSelection>({});
  const [weightText, setWeightText] = useState('');

  function chooseClient(next: string) {
    setClientId(next);
    setSelection({});
    setItems(null);
    if (!next) return;
    startLoading(async () => {
      const result = await listReceivedForClientAction(next);
      if (result.ok) setItems(result.items);
      else toast.error('No se pudieron cargar los productos', { description: result.error });
    });
  }

  const groups: ChecklistGroup[] = useMemo(() => {
    const byCat = new Map<string, ChecklistGroup>();
    for (const p of items ?? []) {
      const key = p.categoryId ?? 'none';
      let g = byCat.get(key);
      if (!g) {
        g = {
          id: key,
          label: p.categoryName ?? 'Sin categoría',
          hint: p.categoryName ? `${formatCurrency(p.chargePerLb)}/lb` : undefined,
          items: [],
        };
        byCat.set(key, g);
      }
      g.items.push({
        id: p.id,
        name: p.name,
        max: p.available,
        subtitle: `Orden #${p.orderId}`,
        href: `/orders/${p.orderId}`,
        meta: `${p.available} disponible${p.available === 1 ? '' : 's'}`,
        disabledReason: p.categoryId ? undefined : 'Sin categoría: asígnala en la orden',
      });
    }
    return [...byCat.values()];
  }, [items]);

  const selection = useMemo(() => pruneSelection(rawSelection, groups), [rawSelection, groups]);
  const summary = useMemo(() => summarize(groups, selection), [groups, selection]);
  const categoriesSelected = groups.filter((g) => (summary.perGroup[g.id]?.units ?? 0) > 0);
  const singleCategory = categoriesSelected.length === 1 ? categoriesSelected[0] : null;
  const chargePerLb = singleCategory
    ? (items?.find((p) => (p.categoryId ?? 'none') === singleCategory.id)?.chargePerLb ?? 0)
    : 0;
  const weight = Number(weightText) || 0;

  function reset() {
    setClientId('');
    setItems(null);
    setSelection({});
    setWeightText('');
  }

  function submit() {
    const picked = pickedItems(selection);
    if (!clientId || picked.length === 0) {
      toast.error('Sin productos marcados', {
        description: 'Elige un cliente y marca qué productos recibidos van en la entrega.',
      });
      return;
    }
    startTransition(async () => {
      const result = await assembleDeliveryAction({
        clientId,
        items: picked,
        weight: singleCategory && weight > 0 ? weight : undefined,
      });
      if (result.ok) {
        toast.success(weight > 0 && singleCategory ? 'Entrega armada y pesada' : 'Productos embolsados', {
          description: describeBags(result.bags) || undefined,
        });
        reset();
        onClose();
      } else {
        toast.error('No se pudo armar la entrega', { description: result.error });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Armar entrega desde recibidos"
      description="Marca qué productos recibidos del cliente van en la entrega; cada categoría llena su propia bolsa."
      icon={<PackagePlus className="h-5 w-5" aria-hidden />}
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {summary.items} producto{summary.items === 1 ? '' : 's'} · {summary.units} unidad
              {summary.units === 1 ? '' : 'es'}
              {categoriesSelected.length > 1 ? ` · ${categoriesSelected.length} bolsas` : ''}
            </p>
            {singleCategory ? (
              <Field
                label="Pesar ahora (lb, opcional)"
                hint={
                  weight > 0
                    ? `Costo ${formatCurrency(round2(weight * chargePerLb))} · la bolsa queda cerrada`
                    : 'Sin peso, la bolsa queda abierta en «Preparar entregas»'
                }
                className="mt-1"
              >
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={weightText}
                  onChange={(e) => setWeightText(e.target.value)}
                />
              </Field>
            ) : categoriesSelected.length > 1 ? (
              <p className="text-xs text-muted">
                Con varias categorías las bolsas se pesan una a una en «Preparar entregas».
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="tertiary" onPress={() => { reset(); onClose(); }} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onPress={submit} isDisabled={isPending || summary.units === 0}>
              {isPending ? (
                <Spinner size="sm" color="current" aria-hidden />
              ) : weight > 0 && singleCategory ? (
                <Scale className="h-4 w-4" aria-hidden />
              ) : (
                <PackagePlus className="h-4 w-4" aria-hidden />
              )}
              {weight > 0 && singleCategory ? 'Armar y pesar' : 'Armar entrega'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Cliente" required>
          <SearchSelect
            value={clientId}
            onChange={(e) => chooseClient(e.target.value)}
            placeholder="— Selecciona un cliente —"
            searchPlaceholder="Buscar cliente por nombre o teléfono…"
            options={clientOptions.map((c) => ({
              value: c.id,
              label: c.label,
              description: c.phoneNumber,
            }))}
          />
        </Field>
        {!clientId ? (
          <p className="surface-card p-4 text-sm text-muted">
            Elige un cliente para ver su mercancía recibida sin entregar.
          </p>
        ) : isLoading || items === null ? (
          <p className="surface-card p-4 text-sm text-muted">Cargando productos…</p>
        ) : (
          <ProductChecklist
            key={clientId}
            groups={groups}
            value={selection}
            onChange={setSelection}
            emptyMessage="Este cliente no tiene mercancía recibida sin entregar."
            searchPlaceholder="Buscar producto…"
          />
        )}
      </div>
    </AppModal>
  );
}
