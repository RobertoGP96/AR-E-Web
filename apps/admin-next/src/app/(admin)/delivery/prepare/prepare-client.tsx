'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Check,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  Minus,
  Package,
  PackageCheck,
  PackageSearch,
  Plus,
  Truck,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Spinner } from '@heroui/react';
import { createPreparedDeliveryAction } from '../actions';
import { round2 } from '@/lib/order-cost';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PageHeader,
  StatCard,
  Field,
  Select,
  TextInput,
} from '@/components/ui';
import type { CategoryOption } from '../schema';
import type { PrepareClientGroup, PrepareProduct } from './types';

interface PrepareDeliveryClientProps {
  groups: PrepareClientGroup[];
  categoryOptions: CategoryOption[];
  canWrite: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PrepareDeliveryClient({
  groups,
  categoryOptions,
  canWrite,
}: PrepareDeliveryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    null
  );
  // productId → unidades a entregar (solo del cliente seleccionado).
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [categoryId, setCategoryId] = useState('');
  const [weight, setWeight] = useState('');
  const [deliverDate, setDeliverDate] = useState(todayInput);

  const totals = useMemo(
    () => ({
      products: groups.reduce((sum, g) => sum + g.products.length, 0),
      units: groups.reduce((sum, g) => sum + g.totalReady, 0),
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

  // Tras un refresh los "ready" pueden bajar: la cantidad mostrada y la
  // enviada siempre se recortan al disponible actual.
  const qtyOf = (p: PrepareProduct) => Math.min(picks[p.id] ?? 0, p.ready);

  const selectedItems = selectedGroup
    ? selectedGroup.products.filter((p) => qtyOf(p) > 0)
    : [];
  const totalUnits = selectedItems.reduce((sum, p) => sum + qtyOf(p), 0);

  const cat = categoryOptions.find((c) => c.id === categoryId);
  const weightNum = Number(weight) || 0;
  const weightCostPreview = round2(
    weightNum * (cat?.clientShippingCharge ?? 0)
  );
  const profitPreview = round2(weightNum * (selectedGroup?.agentProfit ?? 0));

  function selectClient(group: PrepareClientGroup) {
    setSelectedClientId(group.clientId);
    // Caso común: entregar todo lo recibido — se preselecciona completo.
    setPicks(
      Object.fromEntries(group.products.map((p) => [p.id, p.ready]))
    );
    setWeight('');
  }

  function toggleProduct(p: PrepareProduct) {
    setPicks((prev) => {
      const next = { ...prev };
      if ((next[p.id] ?? 0) > 0) delete next[p.id];
      else next[p.id] = p.ready;
      return next;
    });
  }

  function setQty(p: PrepareProduct, raw: number) {
    const qty = Math.max(1, Math.min(p.ready, Math.floor(raw) || 1));
    setPicks((prev) => ({ ...prev, [p.id]: qty }));
  }

  function selectAll() {
    if (!selectedGroup) return;
    setPicks(
      Object.fromEntries(selectedGroup.products.map((p) => [p.id, p.ready]))
    );
  }

  function clearAll() {
    setPicks({});
  }

  function handleCreate() {
    if (!selectedGroup) return;
    const items = selectedGroup.products
      .filter((p) => qtyOf(p) > 0)
      .map((p) => ({ productId: p.id, amount: qtyOf(p) }));
    if (items.length === 0) {
      toast.error('Sin productos seleccionados', {
        description:
          'Marca al menos un producto para incluirlo en la entrega.',
      });
      return;
    }
    startTransition(async () => {
      const result = await createPreparedDeliveryAction({
        clientId: selectedGroup.clientId,
        categoryId,
        weight: weightNum,
        deliverDate,
        items,
      });
      if (result.ok) {
        toast.success('Entrega creada', {
          description: `Entrega de ${selectedGroup.clientName} con ${items.length} producto(s) y ${totalUnits} unidad(es).`,
        });
        router.push(result.id ? `/delivery/${result.id}` : '/delivery');
        router.refresh();
      } else {
        toast.error('No se pudo crear la entrega', {
          description: result.error,
        });
        // Los disponibles pueden haber cambiado desde otra sesión.
        router.refresh();
      }
    });
  }

  const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

  function renderProduct(p: PrepareProduct) {
    const qty = qtyOf(p);
    const picked = qty > 0;
    return (
      <li key={p.id}>
        <div
          onClick={canWrite ? () => toggleProduct(p) : undefined}
          className={`surface-card flex flex-wrap items-center gap-3 p-3 transition-all duration-150 ${
            canWrite ? 'cursor-pointer' : ''
          } ${
            picked
              ? 'border-accent/60 ring-1 ring-accent/30'
              : canWrite
                ? 'hover:border-accent/40'
                : ''
          }`}
        >
          {canWrite ? (
            <button
              type="button"
              aria-pressed={picked}
              aria-label={`Seleccionar ${p.name}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleProduct(p);
              }}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                picked
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-transparent'
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 basis-52">
            <p className="truncate text-sm font-semibold text-foreground">
              {p.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
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
              {p.delivered > 0 ? (
                <span className="tabular-nums">
                  Ya entregado {p.delivered}
                </span>
              ) : null}
            </p>
            {p.packages.length > 0 ? (
              <span className="mt-1.5 flex flex-wrap items-center gap-1">
                {p.packages.slice(0, 3).map((pk) => (
                  <Link
                    key={pk.id}
                    href={`/packages/${pk.id}`}
                    onClick={stopRowClick}
                    title={pk.agency}
                    className="inline-flex items-center gap-1 rounded-md bg-default px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:text-accent"
                  >
                    <Package className="h-3 w-3" aria-hidden />
                    {pk.tracking}
                  </Link>
                ))}
                {p.packages.length > 3 ? (
                  <span className="text-[10px] text-muted">
                    +{p.packages.length - 3} más
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          <div
            className="ml-auto flex items-center gap-2"
            onClick={stopRowClick}
          >
            {canWrite && picked ? (
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
                  max={p.ready}
                  value={qty}
                  aria-label={`Unidades de ${p.name}`}
                  onChange={(e) => setQty(p, Number(e.target.value))}
                  className="h-7 w-12 rounded-md border border-border bg-surface text-center text-sm tabular-nums text-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Sumar una unidad"
                  onClick={() => setQty(p, qty + 1)}
                  disabled={qty >= p.ready}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="pl-1 text-xs text-muted">/ {p.ready}</span>
              </div>
            ) : (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">
                {p.ready} por entregar
              </span>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardList}
        title="Preparar entregas"
        subtitle="Revisa lo recibido por cliente y arma sus entregas en un paso"
        actions={
          <Button variant="tertiary" onPress={() => router.push('/delivery')}>
            <Truck className="h-4 w-4" aria-hidden />
            Ver entregas
          </Button>
        }
      />

      {!canWrite ? (
        <div className="surface-card flex items-center gap-2.5 border-accent/30 bg-accent-soft/30 p-3 text-sm text-foreground">
          <Eye className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          Modo lectura: tu rol permite revisar los productos pendientes, pero
          no crear entregas.
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="surface-card animate-in fade-in duration-300 flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <PackageSearch className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-foreground">
              No hay productos listos para entregar
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Cuando registres recepciones en los paquetes, los productos
              aparecerán aquí agrupados por cliente para armar sus entregas.
            </p>
          </div>
          <Button variant="primary" onPress={() => router.push('/packages')}>
            <Package className="h-4 w-4" aria-hidden />
            Ir a paquetes
          </Button>
        </div>
      ) : (
        <>
          <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Users}
              label="Clientes con productos"
              value={groups.length}
              tone="default"
            />
            <StatCard
              icon={Boxes}
              label="Productos listos"
              value={totals.products}
              tone="accent"
            />
            <StatCard
              icon={PackageCheck}
              label="Unidades por entregar"
              value={totals.units}
              tone="success"
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
                            onClick={() => selectClient(g)}
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
                                {g.products.length} producto
                                {g.products.length === 1 ? '' : 's'} ·{' '}
                                {g.phoneNumber}
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                                {g.totalReady}
                              </span>
                              {g.pending.length > 0 ? (
                                <span className="flex items-center gap-0.5 text-[10px] font-medium text-warning-soft-foreground">
                                  <Clock className="h-3 w-3" aria-hidden />
                                  {g.pending.length} pend.
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

            {/* -------- Detalle del cliente -------- */}
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
                    Elige un cliente de la lista para revisar sus productos
                    recibidos y armar su entrega.
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
                        {selectedGroup.totalReady} unidad
                        {selectedGroup.totalReady === 1 ? '' : 'es'} por
                        entregar
                      </span>
                    </div>
                    {selectedGroup.pending.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-warning-soft-foreground/25 bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="font-medium">
                          Este cliente ya tiene{' '}
                          {selectedGroup.pending.length} entrega
                          {selectedGroup.pending.length === 1 ? '' : 's'} sin
                          completar:
                        </span>
                        {selectedGroup.pending.map((dlv) => (
                          <Link
                            key={dlv.id}
                            href={`/delivery/${dlv.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 font-semibold transition-colors hover:text-accent"
                          >
                            #{dlv.id} · {dlv.status} ·{' '}
                            {formatDate(dlv.deliverDate)}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </header>

                  {canWrite ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted">
                        <span className="font-semibold text-foreground">
                          {selectedItems.length}
                        </span>{' '}
                        de {selectedGroup.products.length} productos
                        seleccionados
                      </p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onPress={selectAll}>
                          Seleccionar todo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={clearAll}
                          isDisabled={selectedItems.length === 0}
                        >
                          Quitar selección
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <ul className="stagger-children space-y-2">
                    {selectedGroup.products.map(renderProduct)}
                  </ul>

                  {canWrite ? (
                    <div className="sticky bottom-2 z-10">
                      <div className="rounded-2xl border border-accent/30 bg-surface/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="min-w-0 flex-1 basis-full sm:basis-40">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted">
                              Resumen de la entrega
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {selectedItems.length} producto
                              {selectedItems.length === 1 ? '' : 's'} ·{' '}
                              {totalUnits} unidad
                              {totalUnits === 1 ? '' : 'es'}
                            </p>
                          </div>
                          <Field label="Categoría" className="w-44">
                            <Select
                              value={categoryId}
                              onChange={(e) => setCategoryId(e.target.value)}
                            >
                              <option value="">— Ninguna —</option>
                              {categoryOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label} ($
                                  {c.clientShippingCharge.toFixed(2)}/lb)
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Peso (lb)" className="w-28">
                            <TextInput
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                            />
                          </Field>
                          <Field label="Fecha" className="w-38">
                            <TextInput
                              type="date"
                              value={deliverDate}
                              onChange={(e) => setDeliverDate(e.target.value)}
                            />
                          </Field>
                          <Button
                            variant="primary"
                            onPress={handleCreate}
                            isDisabled={isPending || totalUnits === 0}
                          >
                            {isPending ? (
                              <Spinner size="sm" aria-hidden />
                            ) : (
                              <Truck className="h-4 w-4" aria-hidden />
                            )}
                            Crear entrega
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-muted">
                          <span>
                            Costo por peso:{' '}
                            <b className="tabular-nums text-foreground">
                              {formatCurrency(weightCostPreview)}
                            </b>
                            {cat
                              ? ` (${weightNum.toFixed(2)} lb × ${formatCurrency(
                                  cat.clientShippingCharge
                                )}/lb)`
                              : ''}
                          </span>
                          <span>
                            Ganancia del gestor:{' '}
                            <b className="tabular-nums text-foreground">
                              {formatCurrency(profitPreview)}
                            </b>
                          </span>
                          <span className="basis-full text-[10px]">
                            La entrega se crea en estado «Pendiente»; el pago
                            se registra después desde Entregas.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
