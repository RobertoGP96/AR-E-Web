'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Box,
  ClipboardList,
  PackageCheck,
  PackageSearch,
  CalendarDays,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { PackageDialog } from './package-dialog';
import { DeletePackageDialog } from './delete-dialog';
import { formatDate } from '@/lib/format';
import { PictureHoverGroup } from '@/components/picture-hover';
import { PackageStatusBadge } from '@/components/status-badges';
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
  role: string;
}

export function PackagesClient({
  initialRows,
  initialQuery,
  initialStatus,
  role,
}: PackagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<PackageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/packages?${params.toString()}`, { scroll: false });
    });
  }

  const rowActions = (row: PackageRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Marcar llegadas de ${row.numberOfTracking}`}
          onPress={() => router.push(`/packages/${row.id}`)}
        >
          <PackageCheck className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Marcar llegadas</Tooltip.Content>
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
          isDisabled={row.receptionCount > 0}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>
          {row.receptionCount > 0
            ? 'Tiene recepciones: elimínalas antes'
            : 'Eliminar'}
        </Tooltip.Content>
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
          <>
            <Button
              variant="tertiary"
              onPress={() => router.push('/delivery/prepare')}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Preparar entregas
            </Button>
            <Button variant="primary" onPress={() => router.push('/packages/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo paquete
            </Button>
          </>
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
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PackageStatusBadge status={row.statusOfProcessing} />
                        {row.receptionCount > 0 ? (
                          <span className="text-xs tabular-nums text-muted">
                            {row.receptionCount} recepci
                            {row.receptionCount === 1 ? 'ón' : 'ones'}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <PictureHoverGroup
                        urls={[row.packagePicture, row.packagePicture2]}
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
                badges={<PackageStatusBadge status={row.statusOfProcessing} />}
                media={
                  <PictureHoverGroup
                    urls={[row.packagePicture, row.packagePicture2]}
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
                    label: 'Recepciones',
                    value: row.receptionCount,
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
        open={editTarget !== null}
        mode="edit"
        role={role}
        pkg={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Paquete actualizado', {
            description: 'Los cambios del paquete se guardaron correctamente.',
          });
        }}
      />

      <DeletePackageDialog
        pkg={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Paquete eliminado', {
            description: 'El paquete se eliminó de forma permanente.',
          });
        }}
      />
    </div>
  );
}
