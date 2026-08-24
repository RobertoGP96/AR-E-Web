'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  Search,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderDialog } from './order-dialog';
import { DeleteOrderDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { OrderStatusBadge, PayStatusBadge } from '@/components/status-badges';
import { ConfirmPaymentDialog } from './confirm-payment-dialog';
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
  const [query, setQuery] = useState(initialFilters.q);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<OrderRow | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`/orders?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <ShoppingCart className="h-8 w-8 text-orange-400" aria-hidden />
            Órdenes
          </h1>
          <p className="mt-2 text-gray-600">
            Gestión de todas las órdenes del sistema
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva orden
        </button>
      </header>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative flex-1 lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Buscar por cliente o teléfono…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', query || null);
            }}
            onBlur={() => {
              if (query !== initialFilters.q) setParam('q', query || null);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <select
          value={initialFilters.status ?? ''}
          onChange={(e) => setParam('status', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Todos los estados</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={initialFilters.pay ?? ''}
          onChange={(e) => setParam('pay', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Todos los pagos</option>
          {PAY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Gestor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Pay</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Cargando…' : 'No hay órdenes.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.salesManagerName ?? (
                        <span className="italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PayStatusBadge status={row.payStatus} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.productCount}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {formatCurrency(row.totalCosts)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (row.payStatus === 'Pagado') {
                              toast.info(
                                `El pedido #${row.id} ya está marcado como Pagado`
                              );
                              return;
                            }
                            setPaymentTarget(row);
                          }}
                          aria-label="Confirmar pago"
                          title="Confirmar pago"
                          className={`rounded-md p-1.5 transition hover:bg-green-50 hover:text-green-600 ${
                            row.payStatus === 'Pagado'
                              ? 'cursor-not-allowed text-zinc-300'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <DollarSign className="h-4 w-4" aria-hidden />
                        </button>
                        <Link
                          href={`/orders/${row.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label="Editar orden"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Eliminar orden"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-zinc-200 lg:hidden dark:divide-zinc-800">
          {initialRows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              {isPending ? 'Cargando…' : 'No hay órdenes.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/orders/${row.id}`}
                    className="font-medium hover:underline"
                  >
                    {row.clientName}
                  </Link>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(row.totalCosts)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <OrderStatusBadge status={row.status} />
                  <PayStatusBadge status={row.payStatus} />
                  <span className="text-zinc-500">
                    {row.productCount} producto(s)
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/orders/${row.id}`}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditTarget(row)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-red-600 dark:border-zinc-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

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
