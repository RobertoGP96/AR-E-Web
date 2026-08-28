'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  DollarSign,
  HandCoins,
  CalendarDays,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PageHeader,
  SearchInput,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import type { CategoryRow } from './schema';

interface CategoriesClientProps {
  initialRows: CategoryRow[];
  initialQuery: string;
}

export function CategoriesClient({
  initialRows,
  initialQuery,
}: CategoriesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  function applyQuery(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('q', next);
    else params.delete('q');
    startTransition(() => {
      router.replace(`/categories?${params.toString()}`);
    });
  }

  const rowActions = (row: CategoryRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Editar ${row.name}`}
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
          aria-label={`Eliminar ${row.name}`}
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
        icon={Tag}
        title="Categorías"
        subtitle="Gestiona las categorías de productos y su costo de envío por libra"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva categoría
          </Button>
        }
      />

      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialQuery}
          placeholder="Buscar por nombre…"
          onApply={applyQuery}
        />
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Costo / lb</th>
                <th>Cargo al cliente / lb</th>
                <th>Creado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={Tag}
                  message={isPending ? 'Cargando…' : 'No hay categorías.'}
                />
              ) : (
                initialRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="font-medium text-foreground">{row.name}</td>
                    <td className="tabular-nums">
                      {formatCurrency(row.shippingCostPerPound)}
                    </td>
                    <td className="tabular-nums">
                      {formatCurrency(row.clientShippingCharge)}
                    </td>
                    <td className="text-muted">{formatDate(row.createdAt)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {rowActions(row)}
                      </div>
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
              {isPending ? 'Cargando…' : 'No hay categorías.'}
            </div>
          ) : (
            initialRows.map((row, index) => (
              <MobileCard
                key={row.id}
                title={row.name}
                subtitle={`Categoría #${index + 1}`}
                rows={[
                  {
                    icon: DollarSign,
                    label: 'Costo / lb',
                    value: formatCurrency(row.shippingCostPerPound),
                  },
                  {
                    icon: HandCoins,
                    label: 'Cargo al cliente / lb',
                    value: formatCurrency(row.clientShippingCharge),
                  },
                  {
                    icon: CalendarDays,
                    label: 'Creado',
                    value: formatDate(row.createdAt),
                  },
                ]}
                actions={rowActions(row)}
              />
            ))
          )
        }
      />

      <CategoryDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Categoría creada', {
            description: 'La nueva categoría ya está disponible.',
          });
          router.refresh();
        }}
      />

      <CategoryDialog
        open={editTarget !== null}
        mode="edit"
        category={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Categoría actualizada', {
            description:
              'Los cambios de la categoría se guardaron correctamente.',
          });
          router.refresh();
        }}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Categoría eliminada', {
            description: 'La categoría se eliminó de forma permanente.',
          });
          router.refresh();
        }}
      />
    </div>
  );
}
