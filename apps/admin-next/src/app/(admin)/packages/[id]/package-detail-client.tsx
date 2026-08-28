'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Trash2,
  PackageCheck,
  PackageSearch,
  CalendarDays,
  Boxes,
  Clock,
  UserRound,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import {
  addReceivedProductAction,
  removeReceivedProductAction,
} from '../actions';
import { formatDate } from '@/lib/format';
import { PackageStatusBadge } from '@/components/status-badges';
import {
  StatCard,
  ConfirmModal,
  Field,
  SearchSelect,
  TextInput,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
  uniqueClientOptions,
} from '@/components/ui';

interface ReceivedProduct {
  id: string;
  productName: string;
  clientName: string;
  amountReceived: number;
  observation: string | null;
}

interface Candidate {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  remaining: number;
}

interface PackageDetailClientProps {
  packageId: string;
  header: {
    agencyName: string;
    numberOfTracking: string;
    status: string;
    arrivalDate: string;
    packagePicture: string | null;
  };
  receivedProducts: ReceivedProduct[];
  candidates: Candidate[];
}

export function PackageDetailClient({
  packageId,
  header,
  receivedProducts,
  candidates,
}: PackageDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [amount, setAmount] = useState(1);
  const [observation, setObservation] = useState('');
  const [removeTarget, setRemoveTarget] = useState<ReceivedProduct | null>(
    null
  );

  const clientOptions = uniqueClientOptions(candidates);
  const filteredCandidates = clientFilter
    ? candidates.filter((c) => c.clientId === clientFilter)
    : candidates;

  const selected = candidates.find((c) => c.id === productId);
  const maxAmount = selected?.remaining ?? 0;

  const unitsReceived = receivedProducts.reduce(
    (sum, rp) => sum + rp.amountReceived,
    0
  );
  const unitsPending = candidates.reduce((sum, c) => sum + c.remaining, 0);

  function handleAdd() {
    if (!productId) {
      toast.error('Producto sin seleccionar', {
        description:
          'Elige un producto de la lista antes de marcarlo como recibido.',
      });
      return;
    }
    startTransition(async () => {
      const result = await addReceivedProductAction(
        packageId,
        productId,
        amount,
        observation
      );
      if (result.ok) {
        toast.success('Producto marcado como recibido', {
          description: selected
            ? `Se registraron ${amount} unidad(es) de «${selected.name}» en el paquete.`
            : `Se registraron ${amount} unidad(es) en el paquete.`,
        });
        setProductId('');
        setAmount(1);
        setObservation('');
        router.refresh();
      } else {
        toast.error('No se pudo registrar la recepción', {
          description: result.error,
        });
      }
    });
  }

  const receptionActions = (rp: ReceivedProduct) => (
    <Tooltip delay={500}>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Eliminar recepción de ${rp.productName}`}
        onPress={() => setRemoveTarget(rp)}
        className="hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
      <Tooltip.Content>Eliminar recepción</Tooltip.Content>
    </Tooltip>
  );

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/packages"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a paquetes
        </Link>
        <Link
          href="/delivery/prepare"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          Preparar entregas
        </Link>
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {header.agencyName}
            </h1>
            <p className="mt-0.5 break-all font-mono text-sm text-muted">
              {header.numberOfTracking}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Llegada: {formatDate(header.arrivalDate)}
            </p>
          </div>
          <PackageStatusBadge status={header.status} />
        </div>

        {header.packagePicture ? (
          <div className="mt-4">
            <Image
              src={header.packagePicture}
              alt={`Foto del paquete ${header.numberOfTracking}`}
              width={320}
              height={240}
              className="h-auto w-full max-w-xs rounded-lg border border-border object-cover"
            />
          </div>
        ) : null}

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            icon={PackageCheck}
            label="Recepciones"
            value={receivedProducts.length}
            tone="accent"
          />
          <StatCard
            icon={Boxes}
            label="Unidades recibidas"
            value={unitsReceived}
            tone="success"
          />
          <StatCard
            icon={Clock}
            label="Por recibir"
            value={unitsPending}
            hint="Compradas sin recepción"
            tone={unitsPending > 0 ? 'warning' : 'default'}
            className="col-span-2 lg:col-span-1"
          />
        </div>
      </header>

      <section className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackageCheck className="h-4 w-4 text-accent" aria-hidden />
          Registrar producto recibido en este paquete
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted">
            No hay productos comprados pendientes de recibir.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Field label="Cliente" className="sm:w-56">
                <SearchSelect
                  value={clientFilter}
                  onChange={(e) => {
                    const next = e.target.value;
                    setClientFilter(next);
                    // El producto elegido deja de ser válido si no es
                    // del cliente filtrado.
                    if (
                      next &&
                      !candidates.some(
                        (c) => c.id === productId && c.clientId === next
                      )
                    ) {
                      setProductId('');
                      setAmount(1);
                    }
                  }}
                  placeholder="Todos los clientes"
                  searchPlaceholder="Buscar cliente…"
                  options={clientOptions}
                />
              </Field>
              <Field label="Producto" className="flex-1">
                <SearchSelect
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setAmount(1);
                  }}
                  placeholder="— Seleccionar —"
                  searchPlaceholder="Buscar producto o cliente…"
                  emptyMessage="Sin productos comprados pendientes para ese filtro"
                  options={filteredCandidates.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.remaining} pendiente${
                      c.remaining === 1 ? '' : 's'
                    })`,
                    description: c.clientName,
                  }))}
                />
              </Field>
              <Field
                label="Cantidad"
                hint={selected ? `Máx. ${maxAmount}` : undefined}
                className="sm:w-28"
              >
                <TextInput
                  type="number"
                  min={1}
                  max={maxAmount || 1}
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      Math.max(
                        1,
                        Math.min(
                          maxAmount || 1,
                          Math.floor(Number(e.target.value) || 1)
                        )
                      )
                    )
                  }
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field label="Observación (opcional)" className="flex-1">
                <TextInput
                  type="text"
                  maxLength={200}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ej: caja dañada, falta accesorio…"
                />
              </Field>
              <Button
                variant="primary"
                onPress={handleAdd}
                isDisabled={isPending || !productId}
                className="sm:mb-0.5"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Registrar
              </Button>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Productos recibidos
        </h2>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cliente</th>
                <th>Recibido</th>
                <th>Observación</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receivedProducts.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={PackageSearch}
                  message="Aún no hay productos recibidos en este paquete."
                />
              ) : (
                receivedProducts.map((rp) => (
                  <tr key={rp.id}>
                    <td className="font-medium text-foreground">
                      {rp.productName}
                    </td>
                    <td className="text-muted">{rp.clientName}</td>
                    <td className="tabular-nums">{rp.amountReceived}</td>
                    <td className="max-w-[200px] truncate text-muted">
                      {rp.observation ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {receptionActions(rp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          receivedProducts.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              Aún no hay productos recibidos en este paquete.
            </div>
          ) : (
            receivedProducts.map((rp) => (
              <MobileCard
                key={rp.id}
                title={rp.productName}
                subtitle={rp.observation ?? undefined}
                rows={[
                  { icon: UserRound, label: 'Cliente', value: rp.clientName },
                  { icon: Boxes, label: 'Recibido', value: rp.amountReceived },
                ]}
                actions={receptionActions(rp)}
              />
            ))
          )
        }
      />

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Eliminar recepción?"
        description={
          removeTarget ? (
            <>
              Se eliminará la recepción de{' '}
              <strong className="text-foreground">
                {removeTarget.amountReceived} unidad
                {removeTarget.amountReceived === 1 ? '' : 'es'}
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
          if (!removeTarget)
            return { ok: false, error: 'Recepción no encontrada' };
          const result = await removeReceivedProductAction(
            packageId,
            removeTarget.id
          );
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Recepción eliminada', {
              description:
                'El producto volvió a la lista de pendientes por recibir.',
            });
            router.refresh();
          }
          return result;
        }}
      />
    </div>
  );
}
