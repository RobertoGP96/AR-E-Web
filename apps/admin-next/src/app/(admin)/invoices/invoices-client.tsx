'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Tags,
  DollarSign,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Chip, Tooltip } from '@heroui/react';
import { InvoiceDialog } from './invoice-dialog';
import { DeleteInvoiceDialog } from './delete-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PageHeader,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import type { InvoiceRow } from './schema';

interface InvoicesClientProps {
  initialRows: InvoiceRow[];
}

export function InvoicesClient({ initialRows }: InvoicesClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvoiceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null);

  const rowActions = (row: InvoiceRow) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Editar factura"
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
          aria-label="Eliminar factura"
          onPress={() => setDeleteTarget(row)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Eliminar</Tooltip.Content>
      </Tooltip>
    </>
  );

  const conceptChip = (row: InvoiceRow) => (
    <Chip color="accent" variant="soft" size="sm" className="whitespace-nowrap">
      <Tags className="h-3.5 w-3.5" aria-hidden />
      <Chip.Label>
        {row.tags.length} concepto{row.tags.length === 1 ? '' : 's'}
      </Chip.Label>
    </Chip>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileText}
        title="Costos de Envío"
        subtitle="Gestiona las facturas de costos de envío del sistema"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva factura
          </Button>
        }
      />

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Conceptos</th>
                <th>Total</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={FileText}
                  message="Aún no hay facturas."
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs text-muted">#{row.id}</td>
                    <td className="font-medium text-foreground">
                      {formatDate(row.date)}
                    </td>
                    <td>{conceptChip(row)}</td>
                    <td className="font-semibold tabular-nums text-success-soft-foreground">
                      {formatCurrency(row.total)}
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
              Aún no hay facturas.
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={formatDate(row.date)}
                subtitle={`Factura #${row.id}`}
                badges={conceptChip(row)}
                rows={[
                  {
                    icon: Tags,
                    label: 'Conceptos',
                    value: row.tags.length,
                  },
                  {
                    icon: DollarSign,
                    label: 'Total',
                    value: (
                      <span className="font-semibold text-success-soft-foreground">
                        {formatCurrency(row.total)}
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

      <InvoiceDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Factura creada', {
            description: 'La nueva factura ya aparece en la lista.',
          });
          router.refresh();
        }}
      />

      <InvoiceDialog
        open={editTarget !== null}
        mode="edit"
        invoice={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Factura actualizada', {
            description: 'Los cambios de la factura se guardaron correctamente.',
          });
          router.refresh();
        }}
      />

      <DeleteInvoiceDialog
        invoice={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Factura eliminada', {
            description: 'La factura se eliminó de forma permanente.',
          });
          router.refresh();
        }}
      />
    </div>
  );
}
