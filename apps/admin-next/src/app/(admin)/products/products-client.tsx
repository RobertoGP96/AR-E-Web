'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package2,
  Search,
  ExternalLink,
  Columns3,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { ProductStatusBadge } from '@/components/status-badges';
import { QRLink } from '@/components/qr-link';

const PRODUCT_STATUSES = [
  'Encargado',
  'Comprado',
  'Recibido',
  'Entregado',
] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

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

// Toggleable columns, like the Vite admin's ProductsColumnsSelector.
const COLUMNS = [
  { key: 'client', label: 'Cliente' },
  { key: 'shop', label: 'Tienda' },
  { key: 'status', label: 'Estado' },
  { key: 'amounts', label: 'Cantidades' },
  { key: 'cost', label: 'Costo Total' },
  { key: 'order', label: 'Orden' },
] as const;
type ColumnKey = (typeof COLUMNS)[number]['key'];

const DEFAULT_VISIBLE: ColumnKey[] = [
  'client',
  'shop',
  'status',
  'amounts',
  'cost',
  'order',
];
const STORAGE_KEY = 'admin-next:products:columns';

function ColumnsSelector({
  visible,
  onChange,
}: {
  visible: Set<ColumnKey>;
  onChange: (next: Set<ColumnKey>) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50"
      >
        <Columns3 className="h-4 w-4" aria-hidden />
        Columnas
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-white p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Columnas visibles
          </p>
          <ul className="space-y-1.5">
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={visible.has(col.key)}
                    onChange={(e) => {
                      const next = new Set(visible);
                      if (e.target.checked) next.add(col.key);
                      else next.delete(col.key);
                      onChange(next);
                    }}
                    className="h-4 w-4 rounded border-gray-300 accent-[oklch(71.065%_0.15929_64.92)]"
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => onChange(new Set(DEFAULT_VISIBLE))}
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Por defecto
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
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
  const [visible, setVisible] = useState<Set<ColumnKey>>(
    () => new Set(DEFAULT_VISIBLE)
  );

  // Restore/persist the column selection (client-only preference).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const keys = COLUMNS.map((c) => c.key) as string[];
          const next = new Set(
            parsed.filter((k): k is ColumnKey => keys.includes(String(k)))
          );
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setVisible(next);
        }
      }
    } catch {
      // corrupted preference — keep defaults
    }
  }, []);

  function updateColumns(next: Set<ColumnKey>) {
    setVisible(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // storage unavailable — selection just won't persist
    }
  }

  const show = (key: ColumnKey) => visible.has(key);
  const colCount = 1 + COLUMNS.filter((c) => visible.has(c.key)).length;

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
    params.delete('page');
    startTransition(() => {
      router.replace(`/products?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          <Package2 className="h-8 w-8 text-orange-400" aria-hidden />
          Productos
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona el inventario y catálogo de productos
        </p>
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
        <div className="hidden md:block">
          <ColumnsSelector visible={visible} onChange={updateColumns} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                {show('client') ? (
                  <th className="px-4 py-3 font-medium">Cliente</th>
                ) : null}
                {show('shop') ? (
                  <th className="px-4 py-3 font-medium">Tienda</th>
                ) : null}
                {show('status') ? (
                  <th className="px-4 py-3 font-medium">Estado</th>
                ) : null}
                {show('amounts') ? (
                  <th className="px-4 py-3 text-right font-medium">
                    Ped / Comp / Rec / Ent
                  </th>
                ) : null}
                {show('cost') ? (
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                ) : null}
                {show('order') ? (
                  <th className="px-4 py-3 text-right font-medium">Orden</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Cargando…' : 'No hay productos.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium capitalize">
                          {row.name}
                        </span>
                        <QRLink url={row.link} name={row.name} />
                      </div>
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
                    {show('client') ? (
                      <td className="px-4 py-3">{row.clientName}</td>
                    ) : null}
                    {show('shop') ? (
                      <td className="px-4 py-3">{row.shopName}</td>
                    ) : null}
                    {show('status') ? (
                      <td className="px-4 py-3">
                        <ProductStatusBadge status={row.status} />
                      </td>
                    ) : null}
                    {show('amounts') ? (
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.amountRequested} / {row.amountPurchased} /{' '}
                        {row.amountReceived} / {row.amountDelivered}
                      </td>
                    ) : null}
                    {show('cost') ? (
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(row.totalCost)}
                      </td>
                    ) : null}
                    {show('order') ? (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${row.orderId}`}
                          className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                        >
                          #{row.orderId}
                        </Link>
                      </td>
                    ) : null}
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
                  <span className="shrink-0">
                    <ProductStatusBadge status={row.status} />
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
