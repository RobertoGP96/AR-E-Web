'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Wallet,
  Users,
  UserRound,
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { Chip } from '@heroui/react';
import { formatCurrency } from '@/lib/format';
import { FilterPopover } from '@/components/filter-popover';
import {
  StatCard,
  SearchInput,
  Field,
  Select,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';

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

export type BalanceStatusFilter = 'deuda' | 'favor' | 'aldia';

const STATUS_LABELS: Record<BalanceStatusFilter, string> = {
  deuda: 'Con deuda',
  favor: 'Con saldo a favor',
  aldia: 'Al día',
};

interface BalancesClientProps {
  initialRows: ClientBalanceRow[];
  totals: { debt: number; credit: number; clients: number };
  initialFilters: { q: string; status: BalanceStatusFilter | null };
}

function BalanceBadge({ balance }: { balance: number }) {
  const [color, label] =
    balance < 0
      ? (['danger', 'DEUDA'] as const)
      : balance > 0
        ? (['success', 'SALDO A FAVOR'] as const)
        : (['accent', 'AL DÍA'] as const);
  return (
    <Chip color={color} variant="soft" size="sm" className="whitespace-nowrap">
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

function balanceTextClass(balance: number): string {
  if (balance < 0) return 'text-danger';
  if (balance > 0) return 'text-success-soft-foreground';
  return '';
}

/**
 * Panel "Balances" de la vista de usuarios (antes /client-balances).
 * El encabezado de página lo pone UsersTabs; aquí solo van métricas,
 * filtros y la tabla. La URL se mantiene en /users con tab=balances.
 */
export function BalancesClient({
  initialRows,
  totals,
  initialFilters,
}: BalancesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`/users?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-5">
      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={TrendingDown}
          label="Deuda total"
          value={formatCurrency(totals.debt)}
          tone="danger"
        />
        <StatCard
          icon={TrendingUp}
          label="Saldo a favor total"
          value={formatCurrency(totals.credit)}
          tone="success"
        />
        <StatCard
          icon={Users}
          label="Clientes listados"
          value={totals.clients}
          tone="accent"
        />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialFilters.q}
          placeholder="Buscar por nombre o teléfono…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de balances"
          subtitle="Filtra clientes por estado de su balance"
          activeFilters={
            initialFilters.status
              ? [
                  {
                    key: 'status',
                    label: STATUS_LABELS[initialFilters.status],
                    onRemove: () => setParam('status', null),
                  },
                ]
              : []
          }
          onClear={() => setParam('status', null)}
        >
          <Field label="Estado">
            <Select
              value={initialFilters.status ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABELS) as BalanceStatusFilter[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                )
              )}
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
                <th>Agente</th>
                <th className="text-right">Órdenes / Entregas</th>
                <th className="text-right">Cobrado</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Balance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={Wallet}
                  message={isPending ? 'Cargando…' : 'No hay clientes.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-medium text-foreground">
                        {row.name}
                      </div>
                      <div className="text-xs text-muted">
                        {row.phoneNumber}
                      </div>
                    </td>
                    <td className="text-muted">
                      {row.agentName ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {row.orderCount} / {row.deliveryCount}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(row.totalReceived)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td
                      className={`text-right font-semibold tabular-nums ${balanceTextClass(row.balance)}`}
                    >
                      {formatCurrency(row.balance)}
                    </td>
                    <td>
                      <BalanceBadge balance={row.balance} />
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
              {isPending ? 'Cargando…' : 'No hay clientes.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.name}
                subtitle={row.phoneNumber}
                badges={<BalanceBadge balance={row.balance} />}
                rows={[
                  {
                    icon: UserRound,
                    label: 'Agente',
                    value: row.agentName ?? '—',
                  },
                  {
                    icon: Receipt,
                    label: 'Órdenes / Entregas',
                    value: `${row.orderCount} / ${row.deliveryCount}`,
                  },
                  {
                    icon: DollarSign,
                    label: 'Cobrado',
                    value: formatCurrency(row.totalReceived),
                  },
                  {
                    icon: DollarSign,
                    label: 'Costo',
                    value: formatCurrency(row.totalCost),
                  },
                  {
                    icon: Wallet,
                    label: 'Balance',
                    value: (
                      <span
                        className={`font-semibold ${balanceTextClass(row.balance)}`}
                      >
                        {formatCurrency(row.balance)}
                      </span>
                    ),
                  },
                ]}
              />
            ))
          )
        }
      />
    </div>
  );
}
