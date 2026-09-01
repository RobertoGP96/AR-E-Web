'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Clock,
  ExternalLink,
  Minus,
  Package,
  PackageSearch,
  Plus,
  Scale,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Spinner } from '@heroui/react';
import {
  addLooseToBagAction,
  adjustBagItemAction,
  registerBagWeightAction,
} from '../actions';
import { round2 } from '@/lib/order-cost';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatCard, ConfirmModal, TextInput } from '@/components/ui';
import { DeliveryStatusBadge } from '@/components/status-badges';
import { describeBags } from '@/lib/open-bags';
import type {
  BagItem,
  LooseProduct,
  OpenBag,
  PrepareClientGroup,
} from './types';

interface BagsStepProps {
  groups: PrepareClientGroup[];
  /** Permiso de escritura sobre entregas (admin / logístico). */
  canWrite: boolean;
  onGoToPackages: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/**
 * Mesa de bolsas: las bolsas se llenan solas al marcar llegadas en la
 * fase de paquetes; aquí el logístico corrige el contenido (algo cayó
 * en la bolsa equivocada), embolsa lo recibido que quedó suelto y pesa
 * cada bolsa. Registrar el peso la cierra: fija costo y ganancia, y la
 * mercancía posterior de esa categoría abre una bolsa nueva.
 */
export function BagsStep({ groups, canWrite, onGoToPackages }: BagsStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    null
  );
  // bagId → texto del input de peso de esa bolsa.
  const [weights, setWeights] = useState<Record<string, string>>({});
  // productId suelto → unidades a embolsar.
  const [looseQty, setLooseQty] = useState<Record<string, number>>({});
  const [weighTarget, setWeighTarget] = useState<OpenBag | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    bag: OpenBag;
    item: BagItem;
  } | null>(null);

  const totals = useMemo(
    () => ({
      bags: groups.reduce((sum, g) => sum + g.bags.length, 0),
      inBags: groups.reduce((sum, g) => sum + g.unitsInBags, 0),
      loose: groups.reduce((sum, g) => sum + g.unitsLoose, 0),
    }),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.clientName.toLowerCase().includes(q) ||
        g.phoneNumber.toLowerCase().includes(q)
    );
  }, [groups, search]);

  const selectedGroup =
    groups.find((g) => g.clientId === selectedClientId) ?? null;

  // Tras un refresh los sueltos pueden bajar: la cantidad mostrada y la
  // enviada siempre se recortan al disponible actual.
  const qtyOf = (p: LooseProduct) =>
    Math.max(1, Math.min(looseQty[p.id] ?? p.loose, p.loose));

  function setQty(p: LooseProduct, raw: number) {
    const qty = Math.max(1, Math.min(p.loose, Math.floor(raw) || 1));
    setLooseQty((prev) => ({ ...prev, [p.id]: qty }));
  }

  function handleAddLoose(items: { productId: string; amount: number }[]) {
    if (items.length === 0) return;
    startTransition(async () => {
      const result = await addLooseToBagAction(items);
      if (result.ok) {
        toast.success('Embolsado', {
          description: describeBags(result.bags) || undefined,
        });
        setLooseQty({});
      } else {
        toast.error('No se pudo embolsar', { description: result.error });
      }
      // En ambos casos los disponibles pueden haber cambiado.
      router.refresh();
    });
  }

  const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

  function renderBag(bag: OpenBag) {
    const weightText = weights[bag.id] ?? '';
    const weightNum = Number(weightText) || 0;
    const costPreview = round2(weightNum * bag.chargePerLb);
    const profitPreview = round2(
      weightNum * (selectedGroup?.agentProfit ?? 0)
    );
    return (
      <div key={bag.id} className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {bag.categoryName ?? 'Sin categoría'}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
              <span className="tabular-nums">
                {formatCurrency(bag.chargePerLb)}/lb
              </span>
              <Link
                href={`/delivery/${bag.id}`}
                className="inline-flex items-center gap-0.5 transition-colors hover:text-accent"
              >
                Entrega #{bag.id}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            </p>
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold tabular-nums text-accent">
            {bag.units} unidad{bag.units === 1 ? '' : 'es'}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {bag.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-3 py-2"
            >
              <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                {item.name}
              </p>
              <span className="rounded-full bg-default px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                ×{item.units}
              </span>
              {canWrite ? (
                <button
                  type="button"
                  aria-label={`Sacar ${item.name} de la bolsa`}
                  onClick={() => setRemoveTarget({ bag, item })}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-danger hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        {canWrite ? (
          <div className="border-t border-border bg-default/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Peso (lb)"
                  value={weightText}
                  aria-label={`Peso de la bolsa ${bag.categoryName ?? bag.id}`}
                  onChange={(e) =>
                    setWeights((prev) => ({
                      ...prev,
                      [bag.id]: e.target.value,
                    }))
                  }
                  className="w-32"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onPress={() => setWeighTarget(bag)}
                isDisabled={isPending || weightNum <= 0}
              >
                <Scale className="h-4 w-4" aria-hidden />
                Pesar y cerrar
              </Button>
              <span className="text-xs text-muted">
                {weightNum > 0 ? (
                  <>
                    Costo:{' '}
                    <b className="tabular-nums text-foreground">
                      {formatCurrency(costPreview)}
                    </b>{' '}
                    · Gestor:{' '}
                    <b className="tabular-nums text-foreground">
                      {formatCurrency(profitPreview)}
                    </b>
                  </>
                ) : (
                  'Al pesar, la bolsa se cierra y se fija su costo.'
                )}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderLoose(p: LooseProduct) {
    const qty = qtyOf(p);
    const noCategory = p.categoryId === null;
    return (
      <li key={p.id}>
        <div className="surface-card flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1 basis-52">
            <p className="truncate text-sm font-semibold text-foreground">
              {p.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
              {noCategory ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 font-medium text-warning-soft-foreground">
                  <Tag className="h-3 w-3" aria-hidden />
                  Sin categoría — asígnala en la orden
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 font-medium text-accent">
                  <Tag className="h-3 w-3" aria-hidden />
                  {p.categoryName}
                </span>
              )}
              <Link
                href={`/orders/${p.orderId}`}
                onClick={stopRowClick}
                className="inline-flex items-center gap-0.5 transition-colors hover:text-accent"
              >
                Orden #{p.orderId}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
              <span className="tabular-nums">
                Recibido {p.received}/{p.requested}
              </span>
            </p>
            {p.packages.length > 0 || p.incoming > 0 ? (
              <span className="mt-1.5 flex flex-wrap items-center gap-1">
                {p.packages.slice(0, 3).map((pk) => (
                  <Link
                    key={pk.id}
                    href={`/packages/${pk.id}`}
                    onClick={stopRowClick}
                    title={`${pk.agency} — ${pk.amount} unidad(es) llegaron en este paquete`}
                    className="inline-flex items-center gap-1 rounded-md bg-default px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:text-accent"
                  >
                    <Package className="h-3 w-3" aria-hidden />
                    {pk.tracking}
                    <b className="tabular-nums">×{pk.amount}</b>
                  </Link>
                ))}
                {p.packages.length > 3 ? (
                  <span className="text-[10px] text-muted">
                    +{p.packages.length - 3} más
                  </span>
                ) : null}
                {p.incoming > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning-soft-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    Faltan {p.incoming} por llegar
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {canWrite && !noCategory ? (
              <>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Restar una unidad"
                    onClick={() => setQty(p, qty - 1)}
                    disabled={qty <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={p.loose}
                    value={qty}
                    aria-label={`Unidades a embolsar de ${p.name}`}
                    onChange={(e) => setQty(p, Number(e.target.value))}
                    className="h-7 w-12 rounded-md border border-border bg-surface text-center text-sm tabular-nums text-foreground focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Sumar una unidad"
                    onClick={() => setQty(p, qty + 1)}
                    disabled={qty >= p.loose}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="pl-1 text-xs text-muted">
                    / {p.loose}
                  </span>
                </div>
                <Button
                  variant="tertiary"
                  size="sm"
                  isDisabled={isPending}
                  onPress={() =>
                    handleAddLoose([{ productId: p.id, amount: qty }])
                  }
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Echar
                </Button>
              </>
            ) : (
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-warning-soft-foreground">
                {p.loose} suelta{p.loose === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </li>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="surface-card animate-in fade-in duration-300 flex flex-col items-center gap-3 p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <ShoppingBag className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">
            No hay bolsas en preparación
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Al marcar llegadas en la revisión de paquetes, cada producto
            cae solo en la bolsa de su cliente y categoría, y aquí se
            ajustan y se pesan.
          </p>
        </div>
        <Button variant="primary" onPress={onGoToPackages}>
          <PackageSearch className="h-4 w-4" aria-hidden />
          Revisar paquetes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="stagger-children grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Clientes"
          value={groups.length}
          tone="default"
        />
        <StatCard
          icon={ShoppingBag}
          label="Bolsas abiertas"
          value={totals.bags}
          tone="accent"
        />
        <StatCard
          icon={Boxes}
          label="Unidades en bolsas"
          value={totals.inBags}
          tone="success"
        />
        <StatCard
          icon={PackageSearch}
          label="Unidades sueltas"
          value={totals.loose}
          hint="Recibidas sin bolsa"
          tone={totals.loose > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] lg:items-start">
        {/* -------- Lista de clientes -------- */}
        <aside
          className={`animate-in fade-in slide-in-from-left-2 duration-300 ${
            selectedClientId ? 'hidden lg:block' : ''
          }`}
        >
          <div className="surface-card overflow-hidden">
            <div className="border-b border-border p-3">
              <TextInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente o teléfono…"
                aria-label="Buscar cliente"
              />
            </div>
            {filteredGroups.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">
                Sin resultados para «{search.trim()}».
              </p>
            ) : (
              <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
                {filteredGroups.map((g) => {
                  const active = g.clientId === selectedClientId;
                  return (
                    <li key={g.clientId}>
                      <button
                        type="button"
                        onClick={() => setSelectedClientId(g.clientId)}
                        aria-current={active ? 'true' : undefined}
                        className={`flex w-full items-center gap-3 border-l-4 px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-l-accent bg-accent-soft/50'
                            : 'border-l-transparent hover:bg-default'
                        }`}
                      >
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xs font-bold text-white"
                        >
                          {initials(g.clientName)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {g.clientName}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {g.bags.length} bolsa
                            {g.bags.length === 1 ? '' : 's'} ·{' '}
                            {g.phoneNumber}
                          </span>
                          {g.totalIncoming > 0 ? (
                            <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-warning-soft-foreground">
                              <Clock className="h-3 w-3" aria-hidden />
                              {g.totalIncoming} en camino
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                            {g.unitsInBags}
                          </span>
                          {g.unitsLoose > 0 ? (
                            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-warning-soft-foreground">
                              {g.unitsLoose} sueltas
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* -------- Bolsas del cliente seleccionado -------- */}
        <section
          className={`min-w-0 space-y-4 ${
            selectedClientId ? '' : 'hidden lg:block'
          }`}
        >
          {!selectedGroup ? (
            <div className="surface-card flex flex-col items-center justify-center gap-2 p-12 text-center">
              <UserRound className="h-8 w-8 text-muted/50" aria-hidden />
              <p className="text-sm font-semibold text-foreground">
                Selecciona un cliente
              </p>
              <p className="max-w-sm text-sm text-muted">
                Elige un cliente para revisar sus bolsas, embolsar lo que
                quedó suelto y pesar cada bolsa cuando esté completa.
              </p>
            </div>
          ) : (
            <div
              key={selectedGroup.clientId}
              className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300"
            >
              <button
                type="button"
                onClick={() => setSelectedClientId(null)}
                className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Elegir otro cliente
              </button>

              <header className="surface-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-sm font-bold text-white"
                  >
                    {initials(selectedGroup.clientName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
                      {selectedGroup.clientName}
                    </h2>
                    <p className="text-sm text-muted">
                      {selectedGroup.phoneNumber}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold tabular-nums text-accent">
                    {selectedGroup.unitsInBags} en bolsa
                    {selectedGroup.unitsInBags === 1 ? '' : 's'}
                  </span>
                </div>
                {selectedGroup.weighed.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-default/60 px-3 py-2 text-xs text-muted">
                    <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="font-medium text-foreground">
                      Ya pesadas sin entregar:
                    </span>
                    {selectedGroup.weighed.map((dlv) => (
                      <Link
                        key={dlv.id}
                        href={`/delivery/${dlv.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 font-semibold text-foreground transition-colors hover:text-accent"
                      >
                        {dlv.categoryName ?? 'Sin categoría'} ·{' '}
                        <span className="tabular-nums">
                          {dlv.weight.toFixed(2)} lb ·{' '}
                          {formatCurrency(dlv.weightCost)}
                        </span>{' '}
                        · {formatDate(dlv.deliverDate)}
                        <DeliveryStatusBadge status={dlv.status} />
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    ))}
                  </div>
                ) : null}
                {selectedGroup.totalIncoming > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-warning-soft-foreground/25 bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      <b>
                        {selectedGroup.totalIncoming} unidad
                        {selectedGroup.totalIncoming === 1 ? '' : 'es'}
                      </b>{' '}
                      de este cliente sigue
                      {selectedGroup.totalIncoming === 1 ? '' : 'n'} en
                      camino. Puedes pesar y cerrar una bolsa ahora: lo que
                      llegue después abrirá otra bolsa de su categoría.
                    </span>
                  </div>
                ) : null}
              </header>

              {/* -------- Bolsas abiertas -------- */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShoppingBag className="h-4 w-4 text-accent" aria-hidden />
                  Bolsas abiertas
                </h3>
                {selectedGroup.bags.length === 0 ? (
                  <p className="surface-card p-4 text-sm text-muted">
                    Sin bolsas abiertas. Se crean solas al marcar llegadas
                    en la fase de paquetes o al embolsar los sueltos de
                    abajo.
                  </p>
                ) : (
                  <div className="stagger-children space-y-3">
                    {selectedGroup.bags.map(renderBag)}
                  </div>
                )}
              </div>

              {/* -------- Recibido sin bolsa -------- */}
              {selectedGroup.loose.length > 0 ? (
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <PackageSearch
                        className="h-4 w-4 text-accent"
                        aria-hidden
                      />
                      Recibido sin bolsa
                    </h3>
                    {canWrite &&
                    selectedGroup.loose.some((p) => p.categoryId !== null) ? (
                      <Button
                        variant="tertiary"
                        size="sm"
                        isDisabled={isPending}
                        onPress={() =>
                          handleAddLoose(
                            selectedGroup.loose
                              .filter((p) => p.categoryId !== null)
                              .map((p) => ({
                                productId: p.id,
                                amount: qtyOf(p),
                              }))
                          )
                        }
                      >
                        {isPending ? (
                          <Spinner size="sm" aria-hidden />
                        ) : (
                          <ShoppingBag className="h-4 w-4" aria-hidden />
                        )}
                        Echar todo a sus bolsas
                      </Button>
                    ) : null}
                  </div>
                  <ul className="stagger-children space-y-2">
                    {selectedGroup.loose.map(renderLoose)}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {/* -------- Confirmación: pesar y cerrar bolsa -------- */}
      <ConfirmModal
        isOpen={weighTarget !== null}
        onClose={() => setWeighTarget(null)}
        title="¿Pesar y cerrar la bolsa?"
        description={
          weighTarget ? (
            <>
              La bolsa de{' '}
              <strong className="text-foreground">
                {weighTarget.categoryName ?? 'Sin categoría'}
              </strong>{' '}
              ({weighTarget.units} unidad
              {weighTarget.units === 1 ? '' : 'es'}) se registrará con{' '}
              <strong className="tabular-nums text-foreground">
                {(Number(weights[weighTarget.id]) || 0).toFixed(2)} lb
              </strong>
              {' → '}
              <strong className="tabular-nums text-foreground">
                {formatCurrency(
                  round2(
                    (Number(weights[weighTarget.id]) || 0) *
                      weighTarget.chargePerLb
                  )
                )}
              </strong>{' '}
              de costo. La bolsa queda cerrada: si llega más mercancía de
              esta categoría se abrirá una bolsa nueva.
            </>
          ) : null
        }
        confirmLabel="Pesar y cerrar"
        onConfirm={async () => {
          if (!weighTarget)
            return { ok: false, error: 'Bolsa no encontrada' };
          const weightNum = Number(weights[weighTarget.id]) || 0;
          const result = await registerBagWeightAction(
            weighTarget.id,
            weightNum
          );
          if (result.ok) {
            setWeighTarget(null);
            setWeights((prev) => {
              const next = { ...prev };
              delete next[weighTarget.id];
              return next;
            });
            toast.success('Bolsa pesada y cerrada', {
              description: `${weighTarget.categoryName ?? 'Sin categoría'} · ${weightNum.toFixed(2)} lb → ${formatCurrency(round2(weightNum * weighTarget.chargePerLb))}.`,
            });
            router.refresh();
          }
          return result;
        }}
      />

      {/* -------- Confirmación: sacar producto de la bolsa -------- */}
      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Sacar de la bolsa?"
        description={
          removeTarget ? (
            <>
              <strong className="text-foreground">
                {removeTarget.item.units} unidad
                {removeTarget.item.units === 1 ? '' : 'es'}
              </strong>{' '}
              de{' '}
              <strong className="text-foreground">
                {removeTarget.item.name}
              </strong>{' '}
              saldrá{removeTarget.item.units === 1 ? '' : 'n'} de la bolsa
              de{' '}
              <strong className="text-foreground">
                {removeTarget.bag.categoryName ?? 'Sin categoría'}
              </strong>{' '}
              y volverá{removeTarget.item.units === 1 ? '' : 'n'} a
              «Recibido sin bolsa».
            </>
          ) : null
        }
        confirmLabel="Sacar de la bolsa"
        onConfirm={async () => {
          if (!removeTarget)
            return { ok: false, error: 'Producto no encontrado' };
          const result = await adjustBagItemAction(removeTarget.item.id, 0);
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Producto fuera de la bolsa', {
              description: `${removeTarget.item.name} volvió a «Recibido sin bolsa».`,
            });
            router.refresh();
          }
          return result;
        }}
      />
    </div>
  );
}
