'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackagePlus, Scale, Truck, UserRound } from 'lucide-react';
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
import { ChecklistSubmitBar } from '@/components/checklist-submit-bar';
import { Field, PageHeader, SearchSelect, TextInput } from '@/components/ui';
import { assembleDeliveryAction, listReceivedForClientAction } from '../actions';
import type { ClientOption, ReceivedCandidate } from '../schema';

interface NewDeliveryClientProps {
  clientOptions: ClientOption[];
  initialClientId: string;
}

export function NewDeliveryClient({ clientOptions, initialClientId }: NewDeliveryClientProps) {
  const router = useRouter();
  const [isLoading, startLoading] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(initialClientId);
  const [items, setItems] = useState<ReceivedCandidate[] | null>(null);
  const [rawSelection, setSelection] = useState<ChecklistSelection>({});
  // categoryId → texto del peso
  const [weights, setWeights] = useState<Record<string, string>>({});

  const load = useCallback(
    (id: string) => {
      startLoading(async () => {
        const result = await listReceivedForClientAction(id);
        if (result.ok) setItems(result.items);
        else toast.error('No se pudieron cargar los productos', { description: result.error });
      });
    },
    [startLoading]
  );

  // Cliente preseleccionado por URL (?client=): carga sus recibidos al entrar.
  useEffect(() => {
    if (initialClientId) load(initialClientId);
  }, [initialClientId, load]);

  function chooseClient(next: string) {
    setClientId(next);
    setSelection({});
    setWeights({});
    setItems(null);
    if (next) load(next);
  }

  const categoryInfo = useMemo(() => {
    const map = new Map<string, { name: string; chargePerLb: number }>();
    for (const p of items ?? []) {
      if (p.categoryId) map.set(p.categoryId, { name: p.categoryName ?? '', chargePerLb: p.chargePerLb });
    }
    return map;
  }, [items]);

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
  const selectedCategories = groups.filter(
    (g) => g.id !== 'none' && (summary.perGroup[g.id]?.units ?? 0) > 0
  );
  const closing = selectedCategories.filter((g) => (Number(weights[g.id]) || 0) > 0);
  const clientLabel = clientOptions.find((c) => c.id === clientId)?.label ?? '';

  function submit() {
    const picked = pickedItems(selection);
    if (!clientId || picked.length === 0) {
      toast.error('Sin productos marcados', {
        description: 'Elige un cliente y marca qué productos recibidos van en la entrega.',
      });
      return;
    }
    const weightMap: Record<string, number> = {};
    for (const g of closing) weightMap[g.id] = round2(Number(weights[g.id]));
    startTransition(async () => {
      const result = await assembleDeliveryAction({
        clientId,
        items: picked,
        weights: Object.keys(weightMap).length > 0 ? weightMap : undefined,
      });
      if (result.ok) {
        toast.success(
          closing.length > 0
            ? `Entrega armada · ${closing.length} bolsa${closing.length === 1 ? '' : 's'} pesada${closing.length === 1 ? '' : 's'}`
            : 'Productos embolsados',
          { description: describeBags(result.bags) || undefined }
        );
        router.push(
          result.id && closing.length > 0 ? `/delivery/${result.id}` : '/delivery/prepare'
        );
      } else {
        toast.error('No se pudo armar la entrega', { description: result.error });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/delivery"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a entregas
        </Link>
      </div>

      <PageHeader
        icon={Truck}
        title="Armar entrega"
        subtitle="Marca qué productos recibidos del cliente van en la entrega; cada categoría llena su propia bolsa y puedes pesarla aquí mismo"
      />

      {/* -------- 1. Cliente -------- */}
      <section className="surface-card space-y-3 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserRound className="h-4 w-4 text-accent" aria-hidden />
          1 · Cliente
        </h2>
        <Field label="Cliente con mercancía recibida" required>
          <SearchSelect
            value={clientId}
            onChange={(e) => chooseClient(e.target.value)}
            placeholder="— Selecciona un cliente —"
            searchPlaceholder="Buscar cliente por nombre o teléfono…"
            emptyMessage="Ningún cliente tiene mercancía recibida sin entregar"
            options={clientOptions.map((c) => ({
              value: c.id,
              label: c.label,
              description: c.phoneNumber,
            }))}
          />
        </Field>
      </section>

      {/* -------- 2. Productos -------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackagePlus className="h-4 w-4 text-accent" aria-hidden />
          2 · ¿Qué va en la entrega?
        </h2>
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
      </section>

      {/* -------- 3. Pesar (opcional) -------- */}
      {selectedCategories.length > 0 ? (
        <section className="surface-card space-y-3 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Scale className="h-4 w-4 text-accent" aria-hidden />
            3 · Pesar ahora (opcional)
          </h2>
          <p className="text-xs text-muted">
            Una bolsa por categoría. Si dejas el peso vacío, la bolsa queda abierta
            en «Preparar entregas» para pesarla después.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCategories.map((g) => {
              const info = categoryInfo.get(g.id);
              const w = Number(weights[g.id]) || 0;
              const units = summary.perGroup[g.id]?.units ?? 0;
              return (
                <Field
                  key={g.id}
                  label={`${g.label} · ${units} u.`}
                  hint={
                    w > 0
                      ? `Costo ${formatCurrency(round2(w * (info?.chargePerLb ?? 0)))} · se cierra`
                      : `${formatCurrency(info?.chargePerLb ?? 0)}/lb · queda abierta`
                  }
                >
                  <TextInput
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="Peso (lb)"
                    value={weights[g.id] ?? ''}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, [g.id]: e.target.value }))
                    }
                  />
                </Field>
              );
            })}
          </div>
        </section>
      ) : null}

      {clientId ? (
        <ChecklistSubmitBar
          title="Entrega"
          summary={`${clientLabel} · ${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'}${
            selectedCategories.length > 0
              ? ` · ${selectedCategories.length} bolsa${selectedCategories.length === 1 ? '' : 's'}${
                  closing.length > 0 ? ` (${closing.length} pesada${closing.length === 1 ? '' : 's'})` : ''
                }`
              : ''
          }`}
          hints={
            <span>
              Las bolsas pesadas quedan listas para despachar; las demás siguen en preparación.
            </span>
          }
          label={closing.length > 0 ? 'Armar y pesar' : 'Armar entrega'}
          icon={closing.length > 0 ? Scale : PackagePlus}
          isPending={isPending}
          disabled={summary.units === 0}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
