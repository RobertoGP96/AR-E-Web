'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Scale,
  Weight,
  TrendingUp,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui/react';
import { BalanceDialog } from './balance-dialog';
import { DeleteBalanceDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PageHeader,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import type { BalanceRow } from './schema';

interface BalanceClientProps {
  initialRows: BalanceRow[];
}

function profit(row: BalanceRow): number {
  return row.revenues - row.buysCosts - row.costs - row.expenses;
}

export function BalanceClient({ initialRows }: BalanceClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BalanceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BalanceRow | null>(null);

  const rowActions = (row: BalanceRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Editar balance"
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
          aria-label="Eliminar balance"
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
        icon={Scale}
        title="Balances"
        subtitle="Compara costos de envío y ganancias esperadas"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo balance
          </Button>
        }
      />

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Peso (sistema / registrado)</th>
                <th>Ingresos</th>
                <th>Compras</th>
                <th>Costos</th>
                <th>Gastos</th>
                <th>Ganancia</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={8}
                  icon={Scale}
                  message="No hay balances."
                />
              ) : (
                initialRows.map((row) => {
                  const p = profit(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="font-medium text-foreground">
                          {formatDate(row.startDate)}
                        </div>
                        <div className="text-xs text-muted">
                          → {formatDate(row.endDate)}
                        </div>
                      </td>
                      <td className="tabular-nums text-muted">
                        {row.systemWeight.toFixed(2)} /{' '}
                        {row.registeredWeight.toFixed(2)}
                      </td>
                      <td className="tabular-nums">
                        {formatCurrency(row.revenues)}
                      </td>
                      <td className="tabular-nums text-muted">
                        {formatCurrency(row.buysCosts)}
                      </td>
                      <td className="tabular-nums text-muted">
                        {formatCurrency(row.costs)}
                      </td>
                      <td className="tabular-nums text-muted">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td
                        className={`font-semibold tabular-nums ${
                          p >= 0
                            ? 'text-success-soft-foreground'
                            : 'text-danger'
                        }`}
                      >
                        {formatCurrency(p)}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-0.5">
                          {rowActions(row)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        }
        cards={
          initialRows.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              No hay balances.
            </div>
          ) : (
            initialRows.map((row) => {
              const p = profit(row);
              return (
                <MobileCard
                  key={row.id}
                  title={`${formatDate(row.startDate)} → ${formatDate(row.endDate)}`}
                  subtitle="Período"
                  rows={[
                    {
                      icon: Weight,
                      label: 'Peso (sistema / registrado)',
                      value: `${row.systemWeight.toFixed(2)} / ${row.registeredWeight.toFixed(2)}`,
                    },
                    {
                      icon: DollarSign,
                      label: 'Ingresos',
                      value: formatCurrency(row.revenues),
                    },
                    {
                      icon: Receipt,
                      label: 'Compras',
                      value: formatCurrency(row.buysCosts),
                    },
                    {
                      icon: Receipt,
                      label: 'Costos',
                      value: formatCurrency(row.costs),
                    },
                    {
                      icon: Receipt,
                      label: 'Gastos',
                      value: formatCurrency(row.expenses),
                    },
                    {
                      icon: TrendingUp,
                      label: 'Ganancia',
                      value: (
                        <span
                          className={`font-semibold ${
                            p >= 0
                              ? 'text-success-soft-foreground'
                              : 'text-danger'
                          }`}
                        >
                          {formatCurrency(p)}
                        </span>
                      ),
                    },
                  ]}
                  actions={rowActions(row)}
                />
              );
            })
          )
        }
      />

      <BalanceDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Balance creado');
          router.refresh();
        }}
      />

      <BalanceDialog
        open={editTarget !== null}
        mode="edit"
        balance={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Balance actualizado');
          router.refresh();
        }}
      />

      <DeleteBalanceDialog
        balance={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Balance eliminado');
          router.refresh();
        }}
      />
    </div>
  );
}
