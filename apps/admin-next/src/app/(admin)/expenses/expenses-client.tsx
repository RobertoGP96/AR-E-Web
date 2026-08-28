'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  UserRound,
  DollarSign,
  Truck,
  Percent,
  Wallet,
  Megaphone,
  Wrench,
  PackageCheck,
  CircleEllipsis,
  type LucideIcon,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Chip, Tooltip } from '@heroui/react';
import { ExpenseDialog } from './expense-dialog';
import { DeleteExpenseDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { FilterPopover } from '@/components/filter-popover';
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
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseRow,
} from './schema';

// Semantic chip per category: orange for the logistics flow, warning
// for fees/marketing, success for payroll, gray for the rest. Red stays
// reserved for destructive actions.
const CATEGORY_CHIPS: Record<
  ExpenseCategory,
  { color: 'accent' | 'default' | 'success' | 'warning'; icon: LucideIcon }
> = {
  Envio: { color: 'accent', icon: Truck },
  Entrega: { color: 'accent', icon: PackageCheck },
  Tasas: { color: 'warning', icon: Percent },
  Publicidad: { color: 'warning', icon: Megaphone },
  Sueldo: { color: 'success', icon: Wallet },
  Operativo: { color: 'default', icon: Wrench },
  Otro: { color: 'default', icon: CircleEllipsis },
};

function CategoryChip({ category }: { category: ExpenseCategory }) {
  const config = CATEGORY_CHIPS[category] ?? CATEGORY_CHIPS.Otro;
  const Icon = config.icon;
  return (
    <Chip
      color={config.color}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
      title={category}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <Chip.Label>{category}</Chip.Label>
    </Chip>
  );
}

interface ExpensesClientProps {
  initialRows: ExpenseRow[];
  initialQuery: string;
  initialCategory: ExpenseCategory | null;
  totalAmount: number;
}

export function ExpensesClient({
  initialRows,
  initialQuery,
  initialCategory,
  totalAmount,
}: ExpensesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/expenses?${params.toString()}`);
    });
  }

  const rowActions = (row: ExpenseRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Editar gasto"
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
          aria-label="Eliminar gasto"
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
        icon={Receipt}
        title="Gastos"
        subtitle="Gestiona los gastos del sistema"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo gasto
          </Button>
        }
      />

      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialQuery}
          placeholder="Buscar por descripción…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de gastos"
          subtitle="Filtra los gastos por categoría"
          activeFilters={
            initialCategory
              ? [
                  {
                    key: 'category',
                    label: initialCategory,
                    onRemove: () => setParam('category', null),
                  },
                ]
              : []
          }
          onClear={() => setParam('category', null)}
        >
          <Field label="Categoría">
            <Select
              value={initialCategory ?? ''}
              onChange={(e) => setParam('category', e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </FilterPopover>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent-soft/40 px-3 py-1.5 lg:ml-auto">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Total mostrado
          </span>
          <span className="text-sm font-bold tabular-nums text-success-soft-foreground">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Registrado por</th>
                <th>Monto</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={Receipt}
                  message={isPending ? 'Cargando…' : 'No hay gastos.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-foreground">
                      {formatDate(row.date)}
                    </td>
                    <td>
                      <CategoryChip category={row.category} />
                    </td>
                    <td className="max-w-64 truncate text-muted">
                      {row.description ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {row.createdByName ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td className="font-semibold tabular-nums">
                      {formatCurrency(row.amount)}
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
              {isPending ? 'Cargando…' : 'No hay gastos.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.description ?? 'Sin descripción'}
                subtitle={formatDate(row.date)}
                badges={<CategoryChip category={row.category} />}
                rows={[
                  {
                    icon: UserRound,
                    label: 'Registrado por',
                    value: row.createdByName ?? '—',
                  },
                  {
                    icon: DollarSign,
                    label: 'Monto',
                    value: (
                      <span className="font-semibold">
                        {formatCurrency(row.amount)}
                      </span>
                    ),
                  },
                ]}
                actions={rowActions(row)}
              />
            ))
          )
        }
      />

      <ExpenseDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Gasto creado', {
            description: 'El nuevo gasto ya aparece en la lista.',
          });
          router.refresh();
        }}
      />

      <ExpenseDialog
        open={editTarget !== null}
        mode="edit"
        expense={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Gasto actualizado', {
            description: 'Los cambios del gasto se guardaron correctamente.',
          });
          router.refresh();
        }}
      />

      <DeleteExpenseDialog
        expense={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Gasto eliminado', {
            description: 'El gasto se eliminó de forma permanente.',
          });
          router.refresh();
        }}
      />
    </div>
  );
}
