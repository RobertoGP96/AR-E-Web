'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  Truck,
  ClipboardList,
  DollarSign,
  ExternalLink,
  PackagePlus,
  ShoppingBag,
  Tag,
  Weight,
  TrendingUp,
  CalendarDays,
  PackageSearch,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { DeliveryDialog } from './delivery-dialog';
import { DeleteDeliveryDialog } from './delete-dialog';
import { ConfirmDeliveryPaymentDialog } from './confirm-payment-dialog';
import { DeliveryActionsBar } from './delivery-actions-bar';
import { formatCurrency, formatDate } from '@/lib/format';
import { DeliveryStatusBadge, PayStatusBadge } from '@/components/status-badges';
import { PictureHover } from '@/components/picture-hover';
import { FilterPopover } from '@/components/filter-popover';
import {
  PageHeader,
  SearchInput,
  Field,
  Select,
  TextInput,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import {
  DELIVERY_PHASES,
  PAY_STATUSES,
  type DeliveryPhase,
  type DeliveryRow,
  type PayStatus,
} from './schema';

interface DeliveryClientProps {
  initialRows: DeliveryRow[];
  role: string;
  /** Bolsas abiertas (fuera de la lista por defecto). */
  openBagCount: number;
  initialFilters: {
    q: string;
    status: DeliveryPhase | null;
    pay: PayStatus | null;
    from: string | null;
    to: string | null;
  };
}

export function DeliveryClient({
  initialRows,
  role,
  openBagCount,
  initialFilters,
}: DeliveryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<DeliveryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRow | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<DeliveryRow | null>(null);
  // Los date inputs son controlados con estado local para que escribir
  // no dependa del roundtrip al servidor que actualiza initialFilters.
  const [fromValue, setFromValue] = useState(initialFilters.from ?? '');
  const [toValue, setToValue] = useState(initialFilters.to ?? '');

  const canWrite = role === 'admin' || role === 'logistical';

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/delivery?${params.toString()}`, { scroll: false });
    });
  }

  function openPayment(row: DeliveryRow) {
    if (row.phase === 'En preparación') {
      toast.info('Bolsa sin pesar', {
        description: 'Pesa la bolsa en «Preparar entregas» antes de cobrarla.',
      });
      return;
    }
    if (row.paymentStatus === 'Pagado') {
      toast.info(`Entrega #${row.id} ya pagada`, {
        description: `La entrega de ${row.clientName} ya está marcada como Pagada.`,
      });
      return;
    }
    setPaymentTarget(row);
  }

  const rowActions = (row: DeliveryRow) => (
    <>
      {canWrite ? (
        <Tooltip delay={500}>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Confirmar pago"
            onPress={() => openPayment(row)}
            className={
              row.paymentStatus === 'Pagado' || row.phase === 'En preparación'
                ? 'text-muted/40'
                : 'text-success-soft-foreground hover:bg-success-soft'
            }
          >
            <DollarSign className="h-4 w-4" aria-hidden />
          </Button>
          <Tooltip.Content>Confirmar pago</Tooltip.Content>
        </Tooltip>
      ) : null}
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Abrir entrega"
          onPress={() => router.push(`/delivery/${row.id}`)}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Ver detalles</Tooltip.Content>
      </Tooltip>
      {canWrite ? (
        <>
          <Tooltip delay={500}>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label="Editar entrega"
              onPress={() => setEditTarget(row)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
            <Tooltip.Content>Editar fecha o foto</Tooltip.Content>
          </Tooltip>
          <Tooltip delay={500}>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label="Eliminar entrega"
              onPress={() => setDeleteTarget(row)}
              className="hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
            <Tooltip.Content>Eliminar</Tooltip.Content>
          </Tooltip>
        </>
      ) : null}
    </>
  );

  const phaseActions = (row: DeliveryRow) =>
    canWrite ? (
      <DeliveryActionsBar
        delivery={{
          id: row.id,
          clientName: row.clientName,
          categoryName: row.categoryName,
          status: row.status,
          weight: row.weight,
          productCount: row.productCount,
          chargePerLb: row.chargePerLb,
          agentProfit: row.agentProfit,
          deliverPicture: row.deliverPicture,
        }}
        role={role}
        compact
      />
    ) : null;

  const activeFilters = [
    ...(initialFilters.status
      ? [{ key: 'status', label: initialFilters.status, onRemove: () => setParam('status', null) }]
      : []),
    ...(initialFilters.pay
      ? [{ key: 'pay', label: initialFilters.pay, onRemove: () => setParam('pay', null) }]
      : []),
    ...(initialFilters.from
      ? [
          {
            key: 'from',
            label: `Desde ${initialFilters.from}`,
            onRemove: () => {
              setFromValue('');
              setParam('from', null);
            },
          },
        ]
      : []),
    ...(initialFilters.to
      ? [
          {
            key: 'to',
            label: `Hasta ${initialFilters.to}`,
            onRemove: () => {
              setToValue('');
              setParam('to', null);
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Truck}
        title="Entregas"
        subtitle="Bolsas pesadas listas para despachar, entregar y cobrar"
        actions={
          <>
            <Button variant="tertiary" onPress={() => router.push('/delivery/prepare')}>
              <ClipboardList className="h-4 w-4" aria-hidden />
              Preparar entregas
              {openBagCount > 0 ? (
                <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-accent">
                  {openBagCount}
                </span>
              ) : null}
            </Button>
            {canWrite ? (
              <Button variant="primary" onPress={() => router.push('/delivery/new')}>
                <PackagePlus className="h-4 w-4" aria-hidden />
                Armar entrega
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialFilters.q}
          placeholder="Buscar por cliente…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de entregas"
          subtitle="Filtra entregas por fase, pago y fecha"
          activeFilters={activeFilters}
          onClear={() => {
            setFromValue('');
            setToValue('');
            const params = new URLSearchParams(searchParams.toString());
            for (const key of ['status', 'pay', 'from', 'to', 'page']) params.delete(key);
            startTransition(() => {
              router.replace(`/delivery?${params.toString()}`, { scroll: false });
            });
          }}
        >
          <Field label="Fase" hint="Sin filtro se ocultan las bolsas en preparación">
            <Select
              value={initialFilters.status ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todas (sin bolsas)</option>
              {DELIVERY_PHASES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de pago">
            <Select
              value={initialFilters.pay ?? ''}
              onChange={(e) => setParam('pay', e.target.value || null)}
            >
              <option value="">Todos los pagos</option>
              {PAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <TextInput
                type="date"
                value={fromValue}
                max={toValue || undefined}
                onChange={(e) => {
                  setFromValue(e.target.value);
                  setParam('from', e.target.value || null);
                }}
              />
            </Field>
            <Field label="Hasta">
              <TextInput
                type="date"
                value={toValue}
                min={fromValue || undefined}
                onChange={(e) => {
                  setToValue(e.target.value);
                  setParam('to', e.target.value || null);
                }}
              />
            </Field>
          </div>
        </FilterPopover>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Categoría</th>
                <th>Peso</th>
                <th>Costo</th>
                <th>Fase</th>
                <th>Pago</th>
                <th>Fecha</th>
                <th>Siguiente paso</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={9}
                  icon={PackageSearch}
                  message={
                    isPending
                      ? 'Cargando…'
                      : 'No hay entregas. Las bolsas se crean al recibir mercancía y se pesan en «Preparar entregas».'
                  }
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/delivery/${row.id}`}
                        className="font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {row.clientName}
                      </Link>
                      <span className="block text-xs text-muted">
                        #{row.id} · {row.productCount} producto{row.productCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {row.categoryName ?? <span className="italic text-muted/60">—</span>}
                    </td>
                    <td className="tabular-nums">{row.weight.toFixed(2)} lb</td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(row.weightCost)}
                      <span className="block text-xs font-normal text-muted">
                        gestor {formatCurrency(row.managerProfit)}
                      </span>
                    </td>
                    <td>
                      <DeliveryStatusBadge status={row.status} weight={row.weight} />
                    </td>
                    <td>
                      <PayStatusBadge status={row.paymentStatus} />
                    </td>
                    <td className="text-muted">{formatDate(row.deliverDate)}</td>
                    <td>{phaseActions(row)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">{rowActions(row)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          initialRows.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              {isPending ? 'Cargando…' : 'No hay entregas. Las bolsas se crean al recibir mercancía.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.clientName}
                subtitle={`Entrega #${row.id} · ${row.productCount} producto${row.productCount === 1 ? '' : 's'}`}
                media={
                  <PictureHover url={row.deliverPicture} alt={`Captura de la entrega ${row.id}`} />
                }
                badges={
                  <>
                    <DeliveryStatusBadge status={row.status} weight={row.weight} />
                    <PayStatusBadge status={row.paymentStatus} />
                  </>
                }
                rows={[
                  { icon: Tag, label: 'Categoría', value: row.categoryName ?? '—' },
                  { icon: Weight, label: 'Peso', value: `${row.weight.toFixed(2)} lb` },
                  {
                    icon: DollarSign,
                    label: 'Costo',
                    value: <span className="font-semibold">{formatCurrency(row.weightCost)}</span>,
                  },
                  { icon: TrendingUp, label: 'Gestor', value: formatCurrency(row.managerProfit) },
                  { icon: CalendarDays, label: 'Fecha', value: formatDate(row.deliverDate) },
                ]}
                actions={
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex justify-end gap-1">{rowActions(row)}</div>
                    <div onClick={(e) => e.stopPropagation()}>{phaseActions(row)}</div>
                  </div>
                }
                onClick={() => router.push(`/delivery/${row.id}`)}
              />
            ))
          )
        }
      />

      {openBagCount > 0 && !initialFilters.status ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
          {openBagCount} bolsa{openBagCount === 1 ? '' : 's'} en preparación
          {openBagCount === 1 ? ' no se muestra' : ' no se muestran'} aquí.{' '}
          <button
            type="button"
            onClick={() => setParam('status', 'En preparación')}
            className="font-medium text-accent hover:underline"
          >
            Verlas
          </button>
        </p>
      ) : null}

      <DeliveryDialog
        open={editTarget !== null}
        delivery={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Entrega actualizada', {
            description: 'La fecha y la foto se guardaron.',
          });
        }}
      />

      <DeleteDeliveryDialog
        delivery={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Entrega eliminada', {
            description: 'La entrega se eliminó y sus unidades volvieron a «recibido sin bolsa».',
          });
        }}
      />
      {paymentTarget ? (
        <ConfirmDeliveryPaymentDialog
          delivery={paymentTarget}
          onClose={() => setPaymentTarget(null)}
        />
      ) : null}
    </div>
  );
}
