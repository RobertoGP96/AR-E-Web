'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package2, Search, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const PRODUCT_STATUSES = [
  'Encargado',
  'Comprado',
  'Recibido',
  'Entregado',
] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const STATUS_STYLES: Record<ProductStatus, string> = {
  Encargado: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  Comprado: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Recibido:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Entregado:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  shopName: string;
  orderId: string;
  clientName: string;
  status: ProductStatus;
  amountRequested: number;
  amountPurchased: number;
  amountReceived: number;
  amountDelivered: number;
  totalCost: number;
  link: string | null;
}

interface SelectOption {
  id: string;
  label: string;
}

interface ProductsClientProps {
  initialRows: ProductRow[];
  shopOptions: SelectOption[];
  initialFilters: {
    q: string;
    status: ProductStatus | null;
    shop: string | null;
  };
}

export function ProductsClient({
  initialRows,
  shopOptions,
  initialFilters,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialFilters.q);

  function applyParams(
    nextQuery: string,
    nextStatus: ProductStatus | null,
    nextShop: string | null
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery) params.set('q', nextQuery);
    else params.delete('q');
    if (nextStatus) params.set('status', nextStatus);
    else params.delete('status');
    if (nextShop) params.set('shop', nextShop);
    else params.delete('shop');
    startTransition(() => {
      router.replace(`/products?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Package2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todos los productos del sistema, en cualquier orden. Para
            editarlos, entra a su orden.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Buscar por nombre, SKU o cliente…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                applyParams(query, initialFilters.status, initialFilters.shop);
            }}
            onBlur={() => {
              if (query !== initialFilters.q)
                applyParams(query, initialFilters.status, initialFilters.shop);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <select
          value={initialFilters.status ?? ''}
          onChange={(e) => {
            const next = e.target.value as ProductStatus | '';
            applyParams(query, next === '' ? null : next, initialFilters.shop);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Todos los estados</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={initialFilters.shop ?? ''}
          onChange={(e) =>
            applyParams(
              query,
              initialFilters.status,
              e.target.value === '' ? null : e.target.value
            )
          }
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Todas las tiendas</option>
          {shopOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">
                  Ped / Comp / Rec / Ent
                </th>
                <th className="px-4 py-3 text-right font-medium">Costo</th>
                <th className="px-4 py-3 text-right font-medium">Orden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Cargando…' : 'No hay productos.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="truncate font-medium">{row.name}</div>
                      <div className="truncate text-xs text-zinc-500">
                        {row.sku ?? ''}
                        {row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            link
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.clientName}</td>
                    <td className="px-4 py-3">{row.shopName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.amountRequested} / {row.amountPurchased} /{' '}
                      {row.amountReceived} / {row.amountDelivered}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${row.orderId}`}
                        className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                      >
                        #{row.orderId}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-800">
          {initialRows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              {isPending ? 'Cargando…' : 'No hay productos.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {row.name}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {row.clientName} · {row.shopName}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <dt>Ped / Comp / Rec / Ent</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {row.amountRequested} / {row.amountPurchased} /{' '}
                    {row.amountReceived} / {row.amountDelivered}
                  </dd>
                  <dt>Costo</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(row.totalCost)}
                  </dd>
                  <dt>Orden</dt>
                  <dd className="text-right">
                    <Link
                      href={`/orders/${row.orderId}`}
                      className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      #{row.orderId}
                    </Link>
                  </dd>
                </dl>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
