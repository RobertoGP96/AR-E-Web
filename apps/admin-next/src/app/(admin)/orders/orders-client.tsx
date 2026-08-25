'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  DollarSign,
  ExternalLink,
  UserRound,
  CalendarDays,
  PackageSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui/react';
import { OrderDialog } from './order-dialog';
import { DeleteOrderDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { OrderStatusBadge, PayStatusBadge } from '@/components/status-badges';
import { FilterPopover } from '@/components/filter-popover';
import { ConfirmPaymentDialog } from './confirm-payment-dialog';
import {
  PageHeader,
  SearchInput,
  Field,
  Select,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import {
  ORDER_STATUSES,
  PAY_STATUSES,
  type OrderRow,
  type OrderStatus,
  type PayStatus,
  type SelectOption,
} from './schema';

interface OrdersClientProps {
  initialRows: OrderRow[];
  clientOptions: SelectOption[];
  managerOptions: SelectOption[];
  initialFilters: {
    q: string;
    status: OrderStatus | null;
    pay: PayStatus | null;
  };
}

export function OrdersClient({
  initialRows,
  clientOptions,
  managerOptions,
  initialFilters,
}: OrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<OrderRow | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/orders?${params.toString()}`);
    });
  }

  function openPayment(row: OrderRow) {
    if (row.payStatus === 'Pagado') {
      toast.info(`El pedido #${row.id} ya está marcado como Pagado`);
      return;
    }
    setPaymentTarget(row);
  }

  const rowActions = (row: OrderRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Confirmar pago"
          onPress={() => openPayment(row)}
          className={
            row.payStatus === 'Pagado'
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
          aria-label="Abrir orden"
          onPress={() => router.push(`/orders/${row.id}`)}
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
          aria-label="Editar orden"
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
          aria-label="Eliminar orden"
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
        icon={ShoppingCart}
        title="Órdenes"
        subtitle="Gestión de todas las órdenes del sistema"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva orden
          </Button>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialFilters.q}
          placeholder="Buscar por cliente o teléfono…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de órdenes"
          subtitle="Filtra órdenes por estado y tipo de pago"
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
          ]}
          onClear={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('status');
            params.delete('pay');
            params.delete('page');
            startTransition(() => {
              router.replace(`/orders?${params.toString()}`);
            });
          }}
        >
          <Field label="Estado">
            <Select
              value={initialFilters.status ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos los estados</option>
              {ORDER_STATUSES.map((s) => (
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
        </FilterPopover>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Gestor</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Creado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={8}
                  icon={PackageSearch}
                  message={isPending ? 'Cargando…' : 'No hay órdenes.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/orders/${row.id}`}
                        className="font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="text-muted">
                      {row.salesManagerName ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td>
                      <OrderStatusBadge status={row.status} />
                    </td>
                    <td>
                      <PayStatusBadge status={row.payStatus} />
                    </td>
                    <td className="text-muted">{row.productCount}</td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(row.totalCosts)}
                    </td>
                    <td className="text-muted">{formatDate(row.createdAt)}</td>
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
              {isPending ? 'Cargando…' : 'No hay órdenes.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.clientName}
                subtitle={`Orden #${row.id}`}
                badges={
                  <>
                    <OrderStatusBadge status={row.status} />
                    <PayStatusBadge status={row.payStatus} />
                  </>
                }
                rows={[
                  {
                    icon: UserRound,
                    label: 'Gestor',
                    value: row.salesManagerName ?? '—',
                  },
                  {
                    icon: PackageSearch,
                    label: 'Productos',
                    value: row.productCount,
                  },
                  {
                    icon: DollarSign,
                    label: 'Total',
                    value: (
                      <span className="font-semibold">
                        {formatCurrency(row.totalCosts)}
                      </span>
                    ),
                  },
                  {
                    icon: CalendarDays,
                    label: 'Creado',
                    value: formatDate(row.createdAt),
                  },
                ]}
                actions={rowActions(row)}
                onClick={() => router.push(`/orders/${row.id}`)}
              />
            ))
          )
        }
      />

      <OrderDialog
        open={createOpen}
        mode="create"
        clientOptions={clientOptions}
        managerOptions={managerOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={(newId) => {
          setCreateOpen(false);
          toast.success('Orden creada');
          if (newId) router.push(`/orders/${newId}`);
          else router.refresh();
        }}
      />

      <OrderDialog
        open={editTarget !== null}
        mode="edit"
        order={editTarget ?? undefined}
        clientOptions={clientOptions}
        managerOptions={managerOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Orden actualizada');
          router.refresh();
        }}
      />

      <DeleteOrderDialog
        order={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Orden eliminada');
          router.refresh();
        }}
      />
      {paymentTarget ? (
        <ConfirmPaymentDialog
          order={paymentTarget}
          onClose={() => setPaymentTarget(null)}
        />
      ) : null}
    </div>
  );
}
