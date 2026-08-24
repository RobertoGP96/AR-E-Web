'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
  ExternalLink,
  CreditCard,
  CalendarDays,
  DollarSign,
  PackageSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui/react';
import { PurchaseDialog } from './purchase-dialog';
import { DeletePurchaseDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { PurchasePayBadge } from '@/components/status-badges';
import { FilterPopover } from '@/components/filter-popover';
import {
  PageHeader,
  Field,
  NativeSelect,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import {
  PAY_STATUSES,
  type PayStatus,
  type PurchaseRow,
  type ShopWithAccounts,
} from './schema';

interface PurchasesClientProps {
  initialRows: PurchaseRow[];
  shopOptions: ShopWithAccounts[];
  initialStatus: PayStatus | null;
}

export function PurchasesClient({
  initialRows,
  shopOptions,
  initialStatus,
}: PurchasesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRow | null>(null);

  function setStatus(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('status', value);
    else params.delete('status');
    params.delete('page');
    startTransition(() => {
      router.replace(`/purchases?${params.toString()}`);
    });
  }

  const rowActions = (row: PurchaseRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Abrir compra"
          onPress={() => router.push(`/purchases/${row.id}`)}
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
          aria-label="Editar compra"
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
          aria-label="Eliminar compra"
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
        icon={ShoppingBag}
        title="Compras"
        subtitle="Gestión de las compras en tiendas"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva compra
          </Button>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <FilterPopover
          title="Filtros de compras"
          subtitle="Filtra compras por estado de pago"
          activeFilters={
            initialStatus
              ? [
                  {
                    key: 'status',
                    label: initialStatus,
                    onRemove: () => setStatus(null),
                  },
                ]
              : []
          }
          onClear={() => setStatus(null)}
        >
          <Field label="Estado de pago">
            <NativeSelect
              value={initialStatus ?? ''}
              onChange={(e) => setStatus(e.target.value || null)}
            >
              <option value="">Todos los pagos</option>
              {PAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </FilterPopover>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tienda</th>
                <th>Cuenta</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Total</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={PackageSearch}
                  message={isPending ? 'Cargando…' : 'No hay compras.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-muted">{formatDate(row.buyDate)}</td>
                    <td>
                      <Link
                        href={`/purchases/${row.id}`}
                        className="font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {row.shopName}
                      </Link>
                    </td>
                    <td className="text-muted">{row.accountName}</td>
                    <td className="text-muted">{row.productCount}</td>
                    <td>
                      <PurchasePayBadge status={row.statusOfShopping} />
                    </td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(row.totalCostOfPurchase)}
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
              {isPending ? 'Cargando…' : 'No hay compras.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.shopName}
                subtitle={`Compra #${row.id}`}
                badges={<PurchasePayBadge status={row.statusOfShopping} />}
                rows={[
                  {
                    icon: CreditCard,
                    label: 'Cuenta',
                    value: row.accountName,
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
                        {formatCurrency(row.totalCostOfPurchase)}
                      </span>
                    ),
                  },
                  {
                    icon: CalendarDays,
                    label: 'Fecha',
                    value: formatDate(row.buyDate),
                  },
                ]}
                actions={rowActions(row)}
                onClick={() => router.push(`/purchases/${row.id}`)}
              />
            ))
          )
        }
      />

      <PurchaseDialog
        open={createOpen}
        mode="create"
        shopOptions={shopOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Compra creada');
          router.refresh();
        }}
      />

      <PurchaseDialog
        open={editTarget !== null}
        mode="edit"
        purchase={editTarget ?? undefined}
        shopOptions={shopOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Compra actualizada');
          router.refresh();
        }}
      />

      <DeletePurchaseDialog
        purchase={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Compra eliminada');
          router.refresh();
        }}
      />
    </div>
  );
}
