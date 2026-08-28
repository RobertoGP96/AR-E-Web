'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Truck,
  ClipboardList,
  DollarSign,
  ExternalLink,
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
  DELIVERY_STATUSES,
  PAY_STATUSES,
  type CategoryOption,
  type ClientOption,
  type DeliveryRow,
  type DeliveryStatus,
  type PayStatus,
} from './schema';

interface DeliveryClientProps {
  initialRows: DeliveryRow[];
  clientOptions: ClientOption[];
  categoryOptions: CategoryOption[];
  initialFilters: {
    q: string;
    status: DeliveryStatus | null;
    pay: PayStatus | null;
    from: string | null;
    to: string | null;
  };
}

export function DeliveryClient({
  initialRows,
  clientOptions,
  categoryOptions,
  initialFilters,
}: DeliveryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeliveryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRow | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<DeliveryRow | null>(null);
  // Los date inputs son controlados con estado local para que escribir
  // no dependa del roundtrip al servidor que actualiza initialFilters.
  const [fromValue, setFromValue] = useState(initialFilters.from ?? '');
  const [toValue, setToValue] = useState(initialFilters.to ?? '');

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/delivery?${params.toString()}`);
    });
  }

  function openPayment(row: DeliveryRow) {
    if (row.paymentStatus === 'Pagado') {
      toast.info(`Entrega #${row.id} ya pagada`, {
        description: `La entrega de ${row.clientName} ya está marcada como Pagada; no hay nada pendiente por cobrar.`,
      });
      return;
    }
    setPaymentTarget(row);
  }

  const rowActions = (row: DeliveryRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Confirmar pago"
          onPress={() => openPayment(row)}
          className={
            row.paymentStatus === 'Pagado'
              ? 'text-muted/40'
              : 'text-success-soft-foreground hover:bg-success-soft'
          }
        >
          <DollarSign className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Confirmar pago</Tooltip.Content>
      </Tooltip>
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
        <Tooltip.Content>Editar</Tooltip.Content>
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
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Truck}
        title="Entregas"
        subtitle="Gestiona las entregas y sus pagos"
        actions={
          <>
            <Button
              variant="tertiary"
              onPress={() => router.push('/delivery/prepare')}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Preparar entregas
            </Button>
            <Button variant="primary" onPress={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Nueva entrega
            </Button>
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
          subtitle="Filtra entregas por estado, pago y fecha"
          activeFilters={[
            ...(initialFilters.status
              ? [
                  {
                    key: 'status',
                    label: initialFilters.status,
                    onRemove: () => setParam('status', null),
                  },
                ]
              : []),
            ...(initialFilters.pay
              ? [
                  {
                    key: 'pay',
                    label: initialFilters.pay,
                    onRemove: () => setParam('pay', null),
                  },
                ]
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
          ]}
          onClear={() => {
            setFromValue('');
            setToValue('');
            const params = new URLSearchParams(searchParams.toString());
            for (const key of ['status', 'pay', 'from', 'to', 'page']) {
              params.delete(key);
            }
            startTransition(() => {
              router.replace(`/delivery?${params.toString()}`);
            });
          }}
        >
          <Field label="Estado">
            <Select
              value={initialFilters.status ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos los estados</option>
              {DELIVERY_STATUSES.map((s) => (
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
                <th>Ganancia</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Fecha</th>
                <th>Captura</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={10}
                  icon={PackageSearch}
                  message={isPending ? 'Cargando…' : 'No hay entregas.'}
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
                    </td>
                    <td className="text-muted">
                      {row.categoryName ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td className="tabular-nums">{row.weight.toFixed(2)}</td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(row.weightCost)}
                    </td>
                    <td className="tabular-nums text-muted">
                      {formatCurrency(row.managerProfit)}
                    </td>
                    <td>
                      <DeliveryStatusBadge status={row.status} />
                    </td>
                    <td>
                      <PayStatusBadge status={row.paymentStatus} />
                    </td>
                    <td className="text-muted">{formatDate(row.deliverDate)}</td>
                    <td>
                      <PictureHover
                        url={row.deliverPicture}
                        alt={`Captura de la entrega ${row.id}`}
                      />
                    </td>
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
              {isPending ? 'Cargando…' : 'No hay entregas.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.clientName}
                subtitle={`Entrega #${row.id}`}
                media={
                  <PictureHover
                    url={row.deliverPicture}
                    alt={`Captura de la entrega ${row.id}`}
                  />
                }
                badges={
                  <>
                    <DeliveryStatusBadge status={row.status} />
                    <PayStatusBadge status={row.paymentStatus} />
                  </>
                }
                rows={[
                  {
                    icon: Tag,
                    label: 'Categoría',
                    value: row.categoryName ?? '—',
                  },
                  {
                    icon: Weight,
                    label: 'Peso',
                    value: `${row.weight.toFixed(2)} lb`,
                  },
                  {
                    icon: DollarSign,
                    label: 'Costo',
                    value: (
                      <span className="font-semibold">
                        {formatCurrency(row.weightCost)}
                      </span>
                    ),
                  },
                  {
                    icon: TrendingUp,
                    label: 'Ganancia',
                    value: formatCurrency(row.managerProfit),
                  },
                  {
                    icon: CalendarDays,
                    label: 'Fecha',
                    value: formatDate(row.deliverDate),
                  },
                ]}
                actions={rowActions(row)}
                onClick={() => router.push(`/delivery/${row.id}`)}
              />
            ))
          )
        }
      />

      <DeliveryDialog
        open={createOpen}
        mode="create"
        clientOptions={clientOptions}
        categoryOptions={categoryOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Entrega creada', {
            description: 'La nueva entrega ya aparece en la lista.',
          });
          router.refresh();
        }}
      />

      <DeliveryDialog
        open={editTarget !== null}
        mode="edit"
        delivery={editTarget ?? undefined}
        clientOptions={clientOptions}
        categoryOptions={categoryOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Entrega actualizada', {
            description: 'Los cambios de la entrega se guardaron correctamente.',
          });
          router.refresh();
        }}
      />

      <DeleteDeliveryDialog
        delivery={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Entrega eliminada', {
            description: 'La entrega se eliminó de forma permanente.',
          });
          router.refresh();
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
