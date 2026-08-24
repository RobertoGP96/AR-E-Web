'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export interface ClientBalanceRow {
  id: string;
  name: string;
  phoneNumber: string;
  agentName: string | null;
  orderCount: number;
  deliveryCount: number;
  totalReceived: number;
  totalCost: number;
  balance: number;
  storedBalance: number;
}

type StatusFilter = 'deuda' | 'favor' | 'aldia';

interface ClientBalancesClientProps {
  initialRows: ClientBalanceRow[];
  totals: { debt: number; credit: number; clients: number };
  initialFilters: { q: string; status: StatusFilter | null };
}

function BalanceBadge({ balance }: { balance: number }) {
  if (balance < 0) {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        DEUDA
      </span>
    );
  }
  if (balance > 0) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        SALDO A FAVOR
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      AL DÍA
    </span>
  );
}

export function ClientBalancesClient({
  initialRows,
  totals,
  initialFilters,
}: ClientBalancesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialFilters.q);

  function applyParams(nextQuery: string, nextStatus: StatusFilter | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery) params.set('q', nextQuery);
    else params.delete('q');
    if (nextStatus) params.set('status', nextStatus);
    else params.delete('status');
    startTransition(() => {
      router.replace(`/client-balances?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Saldos de clientes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Balance por cliente: cobrado menos costo de órdenes y entregas.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Deuda total
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatCurrency(totals.debt)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Saldo a favor total
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totals.credit)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Clientes listados
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {totals.clients}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Buscar por nombre o teléfono…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyParams(query, initialFilters.status);
            }}
            onBlur={() => {
              if (query !== initialFilters.q)
                applyParams(query, initialFilters.status);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <select
          value={initialFilters.status ?? ''}
          onChange={(e) => {
            const next = e.target.value as StatusFilter | '';
            applyParams(query, next === '' ? null : next);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Todos</option>
          <option value="deuda">Con deuda</option>
          <option value="favor">Con saldo a favor</option>
          <option value="aldia">Al día</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Agente</th>
                <th className="px-4 py-3 text-right font-medium">
                  Órdenes / Entregas
                </th>
                <th className="px-4 py-3 text-right font-medium">Cobrado</th>
                <th className="px-4 py-3 text-right font-medium">Costo</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Cargando…' : 'No hay clientes.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-zinc-500">
                        {row.phoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.agentName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.orderCount} / {row.deliveryCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.totalReceived)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        row.balance < 0
                          ? 'text-red-600 dark:text-red-400'
                          : row.balance > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : ''
                      }`}
                    >
                      {formatCurrency(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <BalanceBadge balance={row.balance} />
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
              {isPending ? 'Cargando…' : 'No hay clientes.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {row.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {row.phoneNumber}
                    </div>
                  </div>
                  <BalanceBadge balance={row.balance} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <dt>Cobrado</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(row.totalReceived)}
                  </dd>
                  <dt>Costo</dt>
                  <dd className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(row.totalCost)}
                  </dd>
                  <dt>Balance</dt>
                  <dd
                    className={`text-right font-semibold tabular-nums ${
                      row.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : row.balance > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {formatCurrency(row.balance)}
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
