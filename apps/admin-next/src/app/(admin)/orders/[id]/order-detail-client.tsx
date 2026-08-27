'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Phone,
  UserRound,
  Wallet,
  DollarSign,
  Receipt,
  PackageSearch,
  Store,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { ProductDialog } from './product-dialog';
import { ProductDeleteDialog } from './product-delete-dialog';
import { formatCurrency } from '@/lib/format';
import {
  OrderStatusBadge,
  PayStatusBadge,
  ProductStatusBadge,
} from '@/components/status-badges';
import {
  StatCard,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import type { ProductRow, SelectOption } from '../schema';

interface OrderHeader {
  clientName: string;
  clientPhone: string;
  salesManagerName: string | null;
  status: string;
  payStatus: string;
  totalCosts: number;
  receivedValueOfClient: number;
  balanceApplied: number;
  observations: string | null;
}

interface OrderDetailClientProps {
  orderId: string;
  header: OrderHeader;
  products: ProductRow[];
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
}

export function OrderDetailClient({
  orderId,
  header,
  products,
  shopOptions,
  categoryOptions,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const paid = header.receivedValueOfClient + header.balanceApplied;
  const outstanding = Math.max(0, header.totalCosts - paid);

  const productActions = (p: ProductRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Editar ${p.name}`}
          onPress={() => setEditTarget(p)}
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
          aria-label={`Eliminar ${p.name}`}
          onPress={() => setDeleteTarget(p)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Eliminar</Tooltip.Content>
      </Tooltip>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a órdenes
        </Link>
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {header.clientName}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {header.clientPhone}
            </p>
            {header.salesManagerName ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                Gestor: {header.salesManagerName}
              </p>
            ) : null}
            {header.observations ? (
              <p className="mt-2 max-w-prose rounded-lg bg-background px-3 py-2 text-sm text-muted">
                {header.observations}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <OrderStatusBadge status={header.status} />
            <PayStatusBadge status={header.payStatus} />
          </div>
        </div>

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Receipt}
            label="Total"
            value={formatCurrency(header.totalCosts)}
            tone="accent"
          />
          <StatCard
            icon={DollarSign}
            label="Recibido"
            value={formatCurrency(header.receivedValueOfClient)}
            tone="success"
          />
          <StatCard
            icon={Wallet}
            label="Saldo aplicado"
            value={formatCurrency(header.balanceApplied)}
            tone="default"
          />
          <StatCard
            icon={DollarSign}
            label="Pendiente"
            value={formatCurrency(outstanding)}
            tone={outstanding > 0 ? 'danger' : 'success'}
          />
        </div>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Productos
        </h2>
        <Button variant="primary" onPress={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Añadir producto
        </Button>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tienda</th>
                <th>Cant.</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Costo total</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={PackageSearch}
                  message="Aún no hay productos. Añade el primero."
                />
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.categoryName ? (
                        <div className="text-xs text-muted">
                          {p.categoryName}
                        </div>
                      ) : null}
                    </td>
                    <td className="text-muted">{p.shopName}</td>
                    <td className="tabular-nums">{p.amountRequested}</td>
                    <td className="tabular-nums">
                      {formatCurrency(p.shopCost)}
                    </td>
                    <td>
                      <ProductStatusBadge status={p.status} />
                    </td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {productActions(p)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {products.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={5} className="text-right text-muted">
                    Total de la orden
                  </td>
                  <td className="tabular-nums">
                    {formatCurrency(header.totalCosts)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        }
        cards={
          products.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              Aún no hay productos. Añade el primero.
            </div>
          ) : (
            products.map((p) => (
              <MobileCard
                key={p.id}
                title={p.name}
                subtitle={p.categoryName ?? undefined}
                badges={<ProductStatusBadge status={p.status} />}
                rows={[
                  { icon: Store, label: 'Tienda', value: p.shopName },
                  { label: 'Cantidad', value: p.amountRequested },
                  { label: 'Unidad', value: formatCurrency(p.shopCost) },
                  {
                    label: 'Costo total',
                    value: (
                      <span className="font-semibold">
                        {formatCurrency(p.totalCost)}
                      </span>
                    ),
                  },
                ]}
                actions={productActions(p)}
              />
            ))
          )
        }
      />

      <ProductDialog
        open={createOpen}
        mode="create"
        orderId={orderId}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Producto añadido');
          router.refresh();
        }}
      />

      <ProductDialog
        open={editTarget !== null}
        mode="edit"
        orderId={orderId}
        product={editTarget ?? undefined}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Producto actualizado');
          router.refresh();
        }}
      />

      <ProductDeleteDialog
        orderId={orderId}
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Producto eliminado');
          router.refresh();
        }}
      />
    </div>
  );
}
