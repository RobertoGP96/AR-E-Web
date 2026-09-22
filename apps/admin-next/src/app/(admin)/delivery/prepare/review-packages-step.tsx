'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Clock,
  ExternalLink,
  Package,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  Truck,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatDate } from '@/lib/format';
import { PackageStatusBadge } from '@/components/status-badges';
import { StatCard, TextInput } from '@/components/ui';
import { ArrivalChecklist } from '../../packages/arrival-checklist';
import { ReceivedList } from '../../packages/received-list';
import { PackageActionsBar } from '../../packages/package-actions-bar';
import type {
  ArrivalCandidate,
  CategoryChoice,
  ReviewPackage,
} from './types';

interface ReviewPackagesStepProps {
  packages: ReviewPackage[];
  candidates: ArrivalCandidate[];
  truncated: boolean;
  categories: CategoryChoice[];
  role: string;
  /** Permiso de escritura sobre paquetes (admin / logístico). */
  canWrite: boolean;
  initialPackageId: string | null;
  onGoToDeliveries: () => void;
}

const STATUS_RANK: Record<string, number> = {
  Recibido: 0,
  Enviado: 1,
  Procesado: 2,
};

/**
 * Fase «Paquetes» de la mesa de preparación: lista maestra de paquetes
 * y, para el seleccionado, lo ya marcado + el checklist compartido de
 * llegadas (`ArrivalChecklist`, el mismo de /packages/[id]).
 */
export function ReviewPackagesStep({
  packages,
  candidates,
  truncated,
  categories,
  role,
  canWrite,
  initialPackageId,
  onGoToDeliveries,
}: ReviewPackagesStepProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialPackageId && packages.some((p) => p.id === initialPackageId)
      ? initialPackageId
      : null
  );

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
          (showProcessed || p.status !== 'Procesado' || p.id === selectedPackageId) &&
          (!q ||
            p.agency.toLowerCase().includes(q) ||
            p.tracking.toLowerCase().includes(q))
      )
      .sort(
        (a, b) =>
          (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1) ||
          b.arrivalDate.localeCompare(a.arrivalDate)
      );
  }, [packages, search, showProcessed, selectedPackageId]);

  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) ?? null;

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
                Mostrar procesados ({packages.length - pendingPackages.length})
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
                        onClick={() => setSelectedPackageId(pkg.id)}
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
                    Lo marcado como llegado ya está en las bolsas de cada
                    cliente, listo para pesar.
                  </p>
                </div>
                <Button variant="primary" onPress={onGoToDeliveries}>
                  <Truck className="h-4 w-4" aria-hidden />
                  Ir a las bolsas
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
                    <Link
                      href={`/packages/${selectedPackage.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                    >
                      Ver detalle
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-sm text-muted">
                    <span className="font-semibold tabular-nums text-foreground">
                      {selectedPackage.receptions.length}
                    </span>{' '}
                    recepci{selectedPackage.receptions.length === 1 ? 'ón' : 'ones'} ·{' '}
                    <span className="font-semibold tabular-nums text-foreground">
                      {selectedPackage.unitsMarked}
                    </span>{' '}
                    unidad{selectedPackage.unitsMarked === 1 ? '' : 'es'} marcada
                    {selectedPackage.unitsMarked === 1 ? '' : 's'}
                  </p>
                  {canWrite ? (
                    <PackageActionsBar
                      packageId={selectedPackage.id}
                      tracking={selectedPackage.tracking}
                      status={selectedPackage.status}
                      role={role}
                      receptionCount={selectedPackage.receptions.length}
                      compact
                    />
                  ) : null}
                </div>
              </header>

              <ReceivedList
                packageId={selectedPackage.id}
                receptions={selectedPackage.receptions}
                canWrite={canWrite}
              />

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PackageOpen className="h-4 w-4 text-accent" aria-hidden />
                  ¿Qué llegó en este paquete?
                </h3>
                <ArrivalChecklist
                  packageId={selectedPackage.id}
                  packageLabel={selectedPackage.tracking}
                  packageStatus={selectedPackage.status}
                  candidates={candidates}
                  truncated={truncated}
                  categories={categories}
                  canWrite={canWrite}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
