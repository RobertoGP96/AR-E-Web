'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Minus,
  Package,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  Plus,
  StickyNote,
  Trash2,
  Truck,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Spinner } from '@heroui/react';
import {
  registerArrivalsAction,
  removeReceivedProductAction,
  setPackageStatusAction,
} from '../../packages/actions';
import { formatDate } from '@/lib/format';
import { PackageStatusBadge } from '@/components/status-badges';
import {
  StatCard,
  ConfirmModal,
  Field,
  SearchSelect,
  TextInput,
  uniqueClientOptions,
} from '@/components/ui';
import type {
  ArrivalCandidate,
  PackageReception,
  ReviewPackage,
} from './types';

interface ReviewPackagesStepProps {
  packages: ReviewPackage[];
  candidates: ArrivalCandidate[];
  /** Permiso de escritura sobre paquetes (admin / logístico). */
  canWrite: boolean;
  onGoToDeliveries: () => void;
}

const STATUS_RANK: Record<string, number> = {
  Recibido: 0,
  Enviado: 1,
  Procesado: 2,
};

/** Máximo de filas del checklist renderizadas a la vez. */
const MAX_VISIBLE_CANDIDATES = 80;

export function ReviewPackagesStep({
  packages,
  candidates,
  canWrite,
  onGoToDeliveries,
}: ReviewPackagesStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  // productId → unidades que llegaron en el paquete seleccionado.
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [candidateSearch, setCandidateSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [removeTarget, setRemoveTarget] = useState<PackageReception | null>(
    null
  );
  const [finishOpen, setFinishOpen] = useState(false);

  const pendingPackages = useMemo(
    () => packages.filter((p) => p.status !== 'Procesado'),
    [packages]
  );
  const totalPendingUnits = useMemo(
    () => candidates.reduce((sum, c) => sum + c.pendingArrival, 0),
    [candidates]
  );

  const visiblePackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages
      .filter(
        (p) =>
          (showProcessed || p.status !== 'Procesado') &&
          (!q ||
            p.agency.toLowerCase().includes(q) ||
            p.tracking.toLowerCase().includes(q))
      )
      .sort(
        (a, b) =>
          (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1) ||
          b.arrivalDate.localeCompare(a.arrivalDate)
      );
  }, [packages, search, showProcessed]);

  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) ?? null;

  // Tras un refresh el pendiente puede bajar: la cantidad mostrada y la
  // enviada siempre se recortan al disponible actual.
  const qtyOf = (c: ArrivalCandidate) =>
    Math.min(picks[c.id] ?? 0, c.pendingArrival);

  const markedItems = candidates.filter((c) => qtyOf(c) > 0);
  const markedUnits = markedItems.reduce((sum, c) => sum + qtyOf(c), 0);

  const clientOptions = useMemo(
    () => uniqueClientOptions(candidates),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        (!clientFilter || c.clientId === clientFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q))
    );
  }, [candidates, clientFilter, candidateSearch]);

  const visibleCandidates = filteredCandidates.slice(
    0,
    MAX_VISIBLE_CANDIDATES
  );
  const visibleIds = useMemo(
    () => new Set(visibleCandidates.map((c) => c.id)),
    [visibleCandidates]
  );
  const hiddenMarked = markedItems.filter((c) => !visibleIds.has(c.id));

  function selectPackage(pkg: ReviewPackage) {
    setSelectedPackageId(pkg.id);
    // Las marcas pertenecen al bulto físico que se está revisando.
    setPicks({});
    setNotes({});
    setOpenNotes({});
  }

  function toggleCandidate(c: ArrivalCandidate) {
    setPicks((prev) => {
      const next = { ...prev };
      if ((next[c.id] ?? 0) > 0) {
        delete next[c.id];
      } else {
        next[c.id] = c.pendingArrival;
      }
      return next;
    });
    setOpenNotes((prev) => ({ ...prev, [c.id]: false }));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[c.id];
      return next;
    });
  }

  function setQty(c: ArrivalCandidate, raw: number) {
    const qty = Math.max(
      1,
      Math.min(c.pendingArrival, Math.floor(raw) || 1)
    );
    setPicks((prev) => ({ ...prev, [c.id]: qty }));
  }

  function clearMarks() {
    setPicks({});
    setNotes({});
    setOpenNotes({});
  }

  function handleRegister() {
    if (!selectedPackage) return;
    const items = markedItems.map((c) => ({
      productId: c.id,
      amount: qtyOf(c),
      observation: notes[c.id]?.trim() || undefined,
    }));
    if (items.length === 0) {
      toast.error('Sin productos marcados', {
        description:
          'Marca al menos un producto que haya llegado en este paquete.',
      });
      return;
    }
    const units = items.reduce((sum, i) => sum + i.amount, 0);
    const bumpToReceived = selectedPackage.status === 'Enviado';
    startTransition(async () => {
      const result = await registerArrivalsAction({
        packageId: selectedPackage.id,
        setStatus: bumpToReceived ? 'Recibido' : undefined,
        items,
      });
      if (result.ok) {
        toast.success('Llegadas registradas', {
          description: `${items.length} producto(s) · ${units} unidad(es) en ${selectedPackage.tracking}.${
            bumpToReceived ? ' El paquete pasó a «Recibido».' : ''
          }`,
        });
        clearMarks();
        router.refresh();
      } else {
        toast.error('No se pudo registrar las llegadas', {
          description: result.error,
        });
        // Los pendientes pueden haber cambiado desde otra sesión.
        router.refresh();
      }
    });
  }

  const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

  function renderCandidate(c: ArrivalCandidate) {
    const qty = qtyOf(c);
    const picked = qty > 0;
    const unpurchased = c.requested - c.purchased;
    const noteOpen = picked && (openNotes[c.id] ?? false);
    return (
      <li key={c.id}>
        <div
          onClick={canWrite ? () => toggleCandidate(c) : undefined}
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
              aria-label={`Marcar llegada de ${c.name}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleCandidate(c);
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
              {c.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
              <span className="truncate font-medium text-foreground/80">
                {c.clientName}
              </span>
              <Link
                href={`/orders/${c.orderId}`}
                onClick={stopRowClick}
                className="inline-flex items-center gap-0.5 transition-colors hover:text-accent"
              >
                Orden #{c.orderId}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
              <span className="tabular-nums">
                Por llegar {c.pendingArrival} de {c.purchased} compradas
              </span>
              {unpurchased > 0 ? (
                <span className="tabular-nums">
                  · {unpurchased} sin comprar
                </span>
              ) : null}
              {c.received > 0 ? (
                <span className="tabular-nums">
                  · Ya llegaron {c.received}
                </span>
              ) : null}
            </p>
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
                  onClick={() => setQty(c, qty - 1)}
                  disabled={qty <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={c.pendingArrival}
                  value={qty}
                  aria-label={`Unidades llegadas de ${c.name}`}
                  onChange={(e) => setQty(c, Number(e.target.value))}
                  className="h-7 w-12 rounded-md border border-border bg-surface text-center text-sm tabular-nums text-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Sumar una unidad"
                  onClick={() => setQty(c, qty + 1)}
                  disabled={qty >= c.pendingArrival}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="pl-1 text-xs text-muted">
                  / {c.pendingArrival}
                </span>
                <button
                  type="button"
                  aria-label={`Observación para ${c.name}`}
                  aria-pressed={noteOpen}
                  onClick={() =>
                    setOpenNotes((prev) => ({
                      ...prev,
                      [c.id]: !(prev[c.id] ?? false),
                    }))
                  }
                  className={`ml-1 flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                    noteOpen || (notes[c.id] ?? '').trim().length > 0
                      ? 'border-accent text-accent'
                      : 'border-border text-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  <StickyNote className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-warning-soft-foreground">
                {c.pendingArrival} por llegar
              </span>
            )}
          </div>

          {noteOpen ? (
            <div className="basis-full pl-8" onClick={stopRowClick}>
              <TextInput
                type="text"
                maxLength={200}
                value={notes[c.id] ?? ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                }
                placeholder="Observación (opcional): caja dañada, falta accesorio…"
                aria-label={`Observación de ${c.name}`}
              />
            </div>
          ) : null}
        </div>
      </li>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="surface-card animate-in fade-in duration-300 flex flex-col items-center gap-3 p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <PackageSearch className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">
            No hay paquetes registrados
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Crea los paquetes con su agencia y tracking; después vuelve aquí
            para marcar qué productos llegaron en cada uno.
          </p>
        </div>
        {canWrite ? (
          <Button variant="primary" onPress={() => router.push('/packages')}>
            <Package className="h-4 w-4" aria-hidden />
            Ir a paquetes
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={PackageSearch}
          label="Paquetes por revisar"
          value={pendingPackages.length}
          tone={pendingPackages.length > 0 ? 'accent' : 'default'}
        />
        <StatCard
          icon={Boxes}
          label="Productos por llegar"
          value={candidates.length}
          tone="default"
        />
        <StatCard
          icon={Clock}
          label="Unidades por llegar"
          value={totalPendingUnits}
          hint="Compradas sin marcar llegada"
          tone={totalPendingUnits > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] lg:items-start">
        {/* -------- Lista de paquetes -------- */}
        <aside
          className={`animate-in fade-in slide-in-from-left-2 duration-300 ${
            selectedPackageId ? 'hidden lg:block' : ''
          }`}
        >
          <div className="surface-card overflow-hidden">
            <div className="space-y-2 border-b border-border p-3">
              <TextInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar agencia o tracking…"
                aria-label="Buscar paquete"
              />
              <button
                type="button"
                onClick={() => setShowProcessed((v) => !v)}
                aria-pressed={showProcessed}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  showProcessed
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}
              >
                <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                Mostrar procesados (
                {packages.length - pendingPackages.length})
              </button>
            </div>
            {visiblePackages.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">
                {pendingPackages.length === 0 && !showProcessed
                  ? 'No hay paquetes pendientes de revisar.'
                  : `Sin resultados para «${search.trim()}».`}
              </p>
            ) : (
              <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
                {visiblePackages.map((pkg) => {
                  const active = pkg.id === selectedPackageId;
                  return (
                    <li key={pkg.id}>
                      <button
                        type="button"
                        onClick={() => selectPackage(pkg)}
                        aria-current={active ? 'true' : undefined}
                        className={`flex w-full items-center gap-3 border-l-4 px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-l-accent bg-accent-soft/50'
                            : 'border-l-transparent hover:bg-default'
                        }`}
                      >
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
                        >
                          <Package className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {pkg.agency}
                          </span>
                          <span className="block truncate font-mono text-xs text-muted">
                            {pkg.tracking}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                            <CalendarDays className="h-3 w-3" aria-hidden />
                            {formatDate(pkg.arrivalDate)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <PackageStatusBadge status={pkg.status} />
                          {pkg.unitsMarked > 0 ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-accent">
                              {pkg.unitsMarked} u.
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

        {/* -------- Revisión del paquete seleccionado -------- */}
        <section
          className={`min-w-0 space-y-4 ${
            selectedPackageId ? '' : 'hidden lg:block'
          }`}
        >
          {!selectedPackage ? (
            pendingPackages.length === 0 ? (
              <div className="surface-card flex flex-col items-center justify-center gap-3 p-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success-soft-foreground">
                  <PackageCheck className="h-7 w-7" aria-hidden />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Todos los paquetes están revisados
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                    Lo marcado como llegado ya está disponible para armar las
                    entregas de cada cliente.
                  </p>
                </div>
                <Button variant="primary" onPress={onGoToDeliveries}>
                  <Truck className="h-4 w-4" aria-hidden />
                  Armar entregas
                </Button>
              </div>
            ) : (
              <div className="surface-card flex flex-col items-center justify-center gap-2 p-12 text-center">
                <PackageOpen className="h-8 w-8 text-muted/50" aria-hidden />
                <p className="text-sm font-semibold text-foreground">
                  Selecciona un paquete
                </p>
                <p className="max-w-sm text-sm text-muted">
                  Elige un paquete de la lista y marca qué productos llegaron
                  en él. Lo que no llegue quedará pendiente para otro
                  paquete o división del envío.
                </p>
              </div>
            )
          ) : (
            <div
              key={selectedPackage.id}
              className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300"
            >
              <button
                type="button"
                onClick={() => setSelectedPackageId(null)}
                className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Elegir otro paquete
              </button>

              <header className="surface-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {selectedPackage.agency}
                    </h2>
                    <p className="mt-0.5 break-all font-mono text-sm text-muted">
                      {selectedPackage.tracking}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      Llegada: {formatDate(selectedPackage.arrivalDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <PackageStatusBadge status={selectedPackage.status} />
                    {canWrite ? (
                      <Link
                        href={`/packages/${selectedPackage.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                      >
                        Ver detalle
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-sm text-muted">
                    <span className="font-semibold tabular-nums text-foreground">
                      {selectedPackage.receptions.length}
                    </span>{' '}
                    recepci
                    {selectedPackage.receptions.length === 1 ? 'ón' : 'ones'}{' '}
                    ·{' '}
                    <span className="font-semibold tabular-nums text-foreground">
                      {selectedPackage.unitsMarked}
                    </span>{' '}
                    unidad
                    {selectedPackage.unitsMarked === 1 ? '' : 'es'} marcada
                    {selectedPackage.unitsMarked === 1 ? '' : 's'}
                  </p>
                  {canWrite && selectedPackage.status !== 'Procesado' ? (
                    <Button
                      variant="tertiary"
                      size="sm"
                      onPress={() => setFinishOpen(true)}
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden />
                      Terminar revisión
                    </Button>
                  ) : null}
                </div>
              </header>

              {/* -------- Llegadas ya marcadas -------- */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PackageCheck className="h-4 w-4 text-accent" aria-hidden />
                  Marcado en este paquete
                </h3>
                {selectedPackage.receptions.length === 0 ? (
                  <p className="surface-card p-4 text-sm text-muted">
                    Aún no has marcado llegadas en este paquete.
                  </p>
                ) : (
                  <ul className="stagger-children space-y-2">
                    {selectedPackage.receptions.map((rp) => (
                      <li
                        key={rp.id}
                        className="surface-card flex flex-wrap items-center gap-3 p-3"
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success-soft-foreground"
                        >
                          <Check className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {rp.productName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {rp.clientName}
                            {rp.observation ? (
                              <span className="italic">
                                {' '}
                                · {rp.observation}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">
                          ×{rp.amount}
                        </span>
                        {canWrite ? (
                          <button
                            type="button"
                            aria-label={`Eliminar recepción de ${rp.productName}`}
                            onClick={() => setRemoveTarget(rp)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-danger hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* -------- Checklist de llegadas -------- */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <PackageOpen className="h-4 w-4 text-accent" aria-hidden />
                    ¿Qué llegó en este paquete?
                  </h3>
                  {canWrite && markedItems.length > 0 ? (
                    <Button variant="ghost" size="sm" onPress={clearMarks}>
                      Quitar marcas
                    </Button>
                  ) : null}
                </div>

                {candidates.length === 0 ? (
                  <p className="surface-card p-4 text-sm text-muted">
                    No hay productos comprados pendientes de llegar. Todo lo
                    comprado ya fue marcado como recibido.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Field label="Cliente" className="sm:w-56">
                        <SearchSelect
                          value={clientFilter}
                          onChange={(e) => setClientFilter(e.target.value)}
                          placeholder="Todos los clientes"
                          searchPlaceholder="Buscar cliente…"
                          options={clientOptions}
                        />
                      </Field>
                      <Field label="Buscar producto" className="flex-1">
                        <TextInput
                          type="search"
                          value={candidateSearch}
                          onChange={(e) =>
                            setCandidateSearch(e.target.value)
                          }
                          placeholder="Nombre del producto o cliente…"
                        />
                      </Field>
                    </div>

                    {visibleCandidates.length === 0 ? (
                      <p className="surface-card p-4 text-sm text-muted">
                        Sin productos pendientes para ese filtro.
                      </p>
                    ) : (
                      <ul className="stagger-children space-y-2">
                        {visibleCandidates.map(renderCandidate)}
                      </ul>
                    )}
                    {filteredCandidates.length > visibleCandidates.length ? (
                      <p className="text-center text-xs text-muted">
                        Mostrando {visibleCandidates.length} de{' '}
                        {filteredCandidates.length} productos — usa el
                        buscador o el filtro de cliente para acotar.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {canWrite && candidates.length > 0 ? (
                <div className="sticky bottom-2 z-10">
                  <div className="rounded-2xl border border-accent/30 bg-surface/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Llegadas marcadas
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {markedItems.length} producto
                          {markedItems.length === 1 ? '' : 's'} ·{' '}
                          {markedUnits} unidad
                          {markedUnits === 1 ? '' : 'es'}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onPress={handleRegister}
                        isDisabled={isPending || markedUnits === 0}
                      >
                        {isPending ? (
                          <Spinner size="sm" aria-hidden />
                        ) : (
                          <PackageCheck className="h-4 w-4" aria-hidden />
                        )}
                        Registrar llegadas
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-[11px] text-muted">
                      <span>
                        Lo que no marques seguirá pendiente y podrás
                        recibirlo en otro paquete o división.
                      </span>
                      {selectedPackage.status === 'Enviado' ? (
                        <span>
                          Al registrar, el paquete pasará a «Recibido».
                        </span>
                      ) : null}
                      {hiddenMarked.length > 0 ? (
                        <span className="font-medium text-warning-soft-foreground">
                          {hiddenMarked.length} producto
                          {hiddenMarked.length === 1 ? '' : 's'} marcado
                          {hiddenMarked.length === 1 ? '' : 's'} no se ve
                          {hiddenMarked.length === 1 ? '' : 'n'} con el
                          filtro actual.
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Eliminar recepción?"
        description={
          removeTarget ? (
            <>
              Se eliminará la recepción de{' '}
              <strong className="text-foreground">
                {removeTarget.amount} unidad
                {removeTarget.amount === 1 ? '' : 'es'}
              </strong>{' '}
              de{' '}
              <strong className="text-foreground">
                {removeTarget.productName}
              </strong>{' '}
              ({removeTarget.clientName}). El estado del producto se
              recalculará.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (!removeTarget || !selectedPackage)
            return { ok: false, error: 'Recepción no encontrada' };
          const result = await removeReceivedProductAction(
            selectedPackage.id,
            removeTarget.id
          );
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Recepción eliminada', {
              description:
                'El producto volvió a la lista de pendientes por llegar.',
            });
            router.refresh();
          }
          return result;
        }}
      />

      <ConfirmModal
        isOpen={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="¿Terminar la revisión del paquete?"
        description={
          selectedPackage ? (
            <>
              <strong className="text-foreground">
                {selectedPackage.tracking}
              </strong>{' '}
              se marcará como{' '}
              <strong className="text-foreground">Procesado</strong>. Los
              productos que no marcaste seguirán pendientes de llegada y
              podrás recibirlos cuando lleguen en otro paquete o división
              del envío.
            </>
          ) : null
        }
        confirmLabel="Marcar Procesado"
        onConfirm={async () => {
          if (!selectedPackage)
            return { ok: false, error: 'Paquete no encontrado' };
          const result = await setPackageStatusAction(
            selectedPackage.id,
            'Procesado'
          );
          if (result.ok) {
            setFinishOpen(false);
            toast.success('Paquete procesado', {
              description: `La revisión de ${selectedPackage.tracking} quedó cerrada.`,
            });
            router.refresh();
          }
          return result;
        }}
      />
    </div>
  );
}
