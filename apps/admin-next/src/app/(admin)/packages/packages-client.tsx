'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Box,
  PackageCheck,
  PackageSearch,
  CalendarDays,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { PackageDialog } from './package-dialog';
import { DeletePackageDialog } from './delete-dialog';
import { setPackageStatusAction } from './actions';
import { formatDate } from '@/lib/format';
import { PictureHover } from '@/components/picture-hover';
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
import { PACKAGE_STATUSES, type PackageRow, type PackageStatus } from './schema';

interface PackagesClientProps {
  initialRows: PackageRow[];
  initialQuery: string;
  initialStatus: PackageStatus | null;
}

const STATUS_STYLES: Record<PackageStatus, string> = {
  Enviado: 'bg-accent-soft text-accent-soft-foreground',
  Recibido: 'bg-warning-soft text-warning-soft-foreground',
  Procesado: 'bg-success-soft text-success-soft-foreground',
};

export function PackagesClient({
  initialRows,
  initialQuery,
  initialStatus,
}: PackagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/packages?${params.toString()}`);
    });
  }

  function handleStatusChange(row: PackageRow, status: PackageStatus) {
    if (row.statusOfProcessing === status) return;
    setUpdatingId(row.id);
    startTransition(async () => {
      const result = await setPackageStatusAction(row.id, status);
      setUpdatingId(null);
      if (result.ok) {
        toast.success(`Estado del paquete cambiado a ${status}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const statusSelect = (row: PackageRow) => (
    <Select
      value={row.statusOfProcessing}
      onChange={(e) => handleStatusChange(row, e.target.value as PackageStatus)}
      disabled={updatingId === row.id}
      aria-label={`Estado del paquete ${row.numberOfTracking}`}
      className="w-auto"
      triggerClassName={`w-auto min-h-0 rounded-full border-0 px-2.5 py-1 font-medium shadow-none [&_[data-slot=select-value]]:text-xs ${STATUS_STYLES[row.statusOfProcessing]}`}
    >
      {PACKAGE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );

  const rowActions = (row: PackageRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Recepción de ${row.numberOfTracking}`}
          onPress={() => router.push(`/packages/${row.id}`)}
        >
          <PackageCheck className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Recepción de productos</Tooltip.Content>
      </Tooltip>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Editar ${row.numberOfTracking}`}
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
          aria-label={`Eliminar ${row.numberOfTracking}`}
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
        icon={Box}
        title="Paquetes"
        subtitle="Gestiona todos los paquetes en tránsito y entregados"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo paquete
          </Button>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialQuery}
          placeholder="Buscar por agencia o tracking…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de paquetes"
          subtitle="Filtra paquetes por estado de procesamiento"
          activeFilters={
            initialStatus
              ? [
                  {
                    key: 'status',
                    label: initialStatus,
                    onRemove: () => setParam('status', null),
                  },
                ]
              : []
          }
          onClear={() => setParam('status', null)}
        >
          <Field label="Estado">
            <Select
              value={initialStatus ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos los estados</option>
              {PACKAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </FilterPopover>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Agencia</th>
                <th>Llegada</th>
                <th>Estado</th>
                <th>Captura</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={PackageSearch}
                  message={isPending ? 'Cargando…' : 'No hay paquetes.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/packages/${row.id}`}
                        className="font-mono text-xs font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {row.numberOfTracking}
                      </Link>
                    </td>
                    <td className="text-foreground">{row.agencyName}</td>
                    <td className="text-muted">{formatDate(row.arrivalDate)}</td>
                    <td>{statusSelect(row)}</td>
                    <td>
                      <PictureHover
                        url={row.packagePicture}
                        alt={`Captura de ${row.numberOfTracking}`}
                      />
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
              {isPending ? 'Cargando…' : 'No hay paquetes.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={row.agencyName}
                subtitle={
                  <span className="font-mono">{row.numberOfTracking}</span>
                }
                media={
                  <PictureHover
                    url={row.packagePicture}
                    alt={`Captura de ${row.numberOfTracking}`}
                  />
                }
                rows={[
                  {
                    icon: CalendarDays,
                    label: 'Llegada',
                    value: formatDate(row.arrivalDate),
                  },
                  {
                    label: 'Estado',
                    value: (
                      <span onClick={(e) => e.stopPropagation()}>
                        {statusSelect(row)}
                      </span>
                    ),
                  },
                ]}
                actions={rowActions(row)}
                onClick={() => router.push(`/packages/${row.id}`)}
              />
            ))
          )
        }
      />

      <PackageDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Paquete creado');
          router.refresh();
        }}
      />

      <PackageDialog
        open={editTarget !== null}
        mode="edit"
        pkg={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Paquete actualizado');
          router.refresh();
        }}
      />

      <DeletePackageDialog
        pkg={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Paquete eliminado');
          router.refresh();
        }}
      />
    </div>
  );
}
