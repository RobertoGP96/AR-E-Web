'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
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
import { AssignCategoryPopover } from '@/components/assign-category-popover';
import { Select, TextInput } from '@/components/ui';
import { registerArrivalsAction } from './actions';
import type { ArrivalCandidate, CategoryChoice } from './types';

interface ArrivalChecklistProps {
  packageId: string;
  packageLabel: string;
  packageStatus: string;
  candidates: ArrivalCandidate[];
  truncated?: boolean;
  categories: CategoryChoice[];
  canWrite: boolean;
  onRegistered?: () => void;
}

/**
 * «¿Qué llegó en este paquete?» — checklist de productos comprados sin
 * recibir, agrupados por cliente, con filtros por tienda y compra,
 * observación por fila y asignación rápida de categoría. Compartido
 * por /packages/[id] y la fase «Paquetes» de /delivery/prepare.
 */
export function ArrivalChecklist({
  packageId,
  packageLabel,
  packageStatus,
  candidates,
  truncated,
  categories,
  canWrite,
  onRegistered,
}: ArrivalChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rawSelection, setSelection] = useState<ChecklistSelection>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [shopFilter, setShopFilter] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('');

  const closed = packageStatus === 'Procesado';
  const writable = canWrite && !closed;

  const shops = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of candidates) seen.set(c.shopId, c.shopName);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [candidates]);
  const purchases = useMemo(() => {
    const ids = new Set<string>();
    for (const c of candidates) {
      if (shopFilter && c.shopId !== shopFilter) continue;
      for (const id of c.purchaseIds) ids.add(id);
    }
    return [...ids].sort((a, b) => Number(b) - Number(a));
  }, [candidates, shopFilter]);

  const filtered = useMemo(
    () =>
      candidates.filter(
        (c) =>
          (!shopFilter || c.shopId === shopFilter) &&
          (!purchaseFilter || c.purchaseIds.includes(purchaseFilter))
      ),
    [candidates, shopFilter, purchaseFilter]
  );

  const groups: ChecklistGroup[] = useMemo(() => {
    const byClient = new Map<string, ChecklistGroup>();
    for (const c of filtered) {
      let g = byClient.get(c.clientId);
      if (!g) {
        g = { id: c.clientId, label: c.clientName, hint: c.clientPhone, items: [] };
        byClient.set(c.clientId, g);
      }
      const unpurchased = c.requested - c.purchased;
      g.items.push({
        id: c.id,
        name: c.name,
        max: c.pendingArrival,
        subtitle: `${c.shopName} · Orden #${c.orderId}${c.sku ? ` · ${c.sku}` : ''}`,
        href: `/orders/${c.orderId}`,
        meta: `Por llegar ${c.pendingArrival} de ${c.purchased} compradas${
          c.received > 0 ? ` · ya llegaron ${c.received}` : ''
        }${unpurchased > 0 ? ` · ${unpurchased} sin comprar` : ''}${
          c.categoryName ? ` · ${c.categoryName}` : ''
        }`,
        disabledReason:
          c.categoryName === null
            ? 'Sin categoría: asígnala para poder recibirlo'
            : undefined,
      });
    }
    return [...byClient.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered]);

  const selection = useMemo(
    () => pruneSelection(rawSelection, groups),
    [rawSelection, groups]
  );
  const summary = useMemo(() => summarize(groups, selection), [groups, selection]);

  function register() {
    const items = pickedItems(selection).map((i) => ({
      ...i,
      observation: notes[i.productId]?.trim() || undefined,
    }));
    if (items.length === 0) {
      toast.error('Sin productos marcados', {
        description: 'Marca al menos un producto que haya llegado en este paquete.',
      });
      return;
    }
    startTransition(async () => {
      const result = await registerArrivalsAction({ packageId, items });
      if (result.ok) {
        const bagsText = describeBags(result.bags);
        toast.success('Llegadas registradas', {
          description: `${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'} en ${packageLabel}.${
            bagsText ? ` En bolsas: ${bagsText}.` : ''
          }${packageStatus === 'Enviado' ? ' El paquete pasó a «Recibido».' : ''}`,
        });
        setSelection({});
        setNotes({});
        onRegistered?.();
      } else {
        toast.error('No se pudieron registrar las llegadas', {
          description: result.error,
        });
        // Los pendientes pueden haber cambiado desde otra sesión.
        router.refresh();
      }
    });
  }

  if (closed) {
    return (
      <p className="surface-card p-4 text-sm text-muted">
        La revisión de este paquete está cerrada («Procesado»). Un
        administrador puede reabrirla para marcar más llegadas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {truncated ? (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
          Hay más de 1000 productos pendientes de llegar; se muestran los
          primeros. Usa los filtros para acotar.
        </p>
      ) : null}
      <ProductChecklist
        groups={groups}
        value={selection}
        onChange={setSelection}
        readOnly={!writable}
        emptyMessage="No hay productos comprados pendientes de llegar. Todo lo comprado ya fue marcado como recibido."
        searchPlaceholder="Buscar producto, cliente u orden…"
        toolbar={
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {shops.length > 1 ? (
              <Select
                value={shopFilter}
                onChange={(e) => {
                  setShopFilter(e.target.value);
                  setPurchaseFilter('');
                }}
                aria-label="Filtrar por tienda"
                className="sm:w-44"
              >
                <option value="">Todas las tiendas</option>
                {shops.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            ) : null}
            {purchases.length > 1 ? (
              <Select
                value={purchaseFilter}
                onChange={(e) => setPurchaseFilter(e.target.value)}
                aria-label="Filtrar por compra"
                className="sm:w-40"
              >
                <option value="">Todas las compras</option>
                {purchases.map((id) => (
                  <option key={id} value={id}>
                    Compra #{id}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
        }
        itemAction={(item) =>
          item.disabledReason && canWrite ? (
            <AssignCategoryPopover
              productId={item.id}
              productName={item.name}
              categories={categories}
            />
          ) : null
        }
        renderItemExtra={(item) => (
          <TextInput
            type="text"
            maxLength={200}
            value={notes[item.id] ?? ''}
            onChange={(e) =>
              setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
            }
            placeholder="Observación (opcional): caja dañada, falta accesorio…"
            aria-label={`Observación de ${item.name}`}
          />
        )}
      />

      {writable && candidates.length > 0 ? (
        <ChecklistSubmitBar
          title="Llegadas marcadas"
          summary={`${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'}`}
          hints={
            <>
              <span>
                Cada producto caerá solo en la bolsa de su cliente y categoría.
                Lo que no marques seguirá pendiente para otro paquete.
              </span>
              {packageStatus === 'Enviado' ? (
                <span>Al registrar, el paquete pasará a «Recibido».</span>
              ) : null}
            </>
          }
          label="Registrar llegadas"
          icon={PackageCheck}
          isPending={isPending}
          disabled={summary.units === 0}
          onSubmit={register}
        />
      ) : null}
    </div>
  );
}
