'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Store,
  ExternalLink,
  KeyRound,
  Percent,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Chip, Tooltip } from '@heroui/react';
import { ShopDialog } from './shop-dialog';
import { DeleteShopDialog } from './delete-dialog';
import { AccountsDialog } from './accounts-dialog';
import { toggleShopActiveAction } from './actions';
import { formatDate } from '@/lib/format';
import {
  PageHeader,
  SearchInput,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import type { ShopRow } from './schema';

interface ShopsClientProps {
  initialRows: ShopRow[];
  initialQuery: string;
}

export function ShopsClient({ initialRows, initialQuery }: ShopsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopRow | null>(null);
  const [accountsShopId, setAccountsShopId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Always hand the dialog the FRESH row (router.refresh() replaces
  // initialRows) so newly added accounts appear without reopening.
  const accountsShop =
    initialRows.find((r) => r.id === accountsShopId) ?? null;

  function applyQuery(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('q', next);
    else params.delete('q');
    startTransition(() => {
      router.replace(`/shops?${params.toString()}`);
    });
  }

  function handleToggleActive(row: ShopRow) {
    setTogglingId(row.id);
    startTransition(async () => {
      const result = await toggleShopActiveAction(row.id, !row.isActive);
      setTogglingId(null);
      if (result.ok) {
        toast.success(
          `${row.name} ahora está ${row.isActive ? 'inactiva' : 'activa'}`
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const activeChip = (row: ShopRow) => (
    <button
      type="button"
      onClick={() => handleToggleActive(row)}
      disabled={togglingId === row.id}
      aria-label={
        row.isActive ? `Desactivar ${row.name}` : `Activar ${row.name}`
      }
      title={row.isActive ? 'Clic para desactivar' : 'Clic para activar'}
      className="cursor-pointer rounded-full transition-opacity disabled:cursor-wait disabled:opacity-50"
    >
      <Chip
        color={row.isActive ? 'success' : 'default'}
        variant="soft"
        size="sm"
        className="pointer-events-none whitespace-nowrap"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        <Chip.Label>{row.isActive ? 'Activa' : 'Inactiva'}</Chip.Label>
      </Chip>
    </button>
  );

  const rowActions = (row: ShopRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Cuentas de ${row.name}`}
          onPress={() => setAccountsShopId(row.id)}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>
          Cuentas de compra ({row.accounts.length})
        </Tooltip.Content>
      </Tooltip>
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
        icon={Store}
        title="Tiendas y Cuentas"
        subtitle="Gestiona las tiendas y sus cuentas de compra"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva tienda
          </Button>
        }
      />

      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialQuery}
          placeholder="Buscar por nombre o enlace…"
          onApply={applyQuery}
        />
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Enlace</th>
                <th>Tasa de impuesto</th>
                <th>Estado</th>
                <th>Creado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={Store}
                  message={isPending ? 'Cargando…' : 'No hay tiendas.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-foreground">{row.name}</td>
                    <td>
                      <a
                        href={row.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted transition-colors hover:text-accent hover:underline"
                      >
                        Visitar
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </td>
                    <td className="tabular-nums">
                      {row.taxRate.toFixed(2)} %
                    </td>
                    <td>{activeChip(row)}</td>
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
              {isPending ? 'Cargando…' : 'No hay tiendas.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.name}
                subtitle={
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent hover:underline"
                  >
                    Visitar ↗
                  </a>
                }
                badges={activeChip(row)}
                rows={[
                  {
                    icon: Percent,
                    label: 'Tasa de impuesto',
                    value: `${row.taxRate.toFixed(2)} %`,
                  },
                  {
                    icon: KeyRound,
                    label: 'Cuentas de compra',
                    value: row.accounts.length,
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

      <ShopDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Tienda creada');
          router.refresh();
        }}
      />

      <ShopDialog
        open={editTarget !== null}
        mode="edit"
        shop={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Tienda actualizada');
          router.refresh();
        }}
      />

      <DeleteShopDialog
        shop={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Tienda eliminada');
          router.refresh();
        }}
      />

      <AccountsDialog
        shop={accountsShop}
        onClose={() => setAccountsShopId(null)}
      />
    </div>
  );
}
