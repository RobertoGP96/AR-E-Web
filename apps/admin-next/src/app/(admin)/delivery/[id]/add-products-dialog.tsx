'use client';

import { useMemo, useState, useTransition } from 'react';
import { PackagePlus } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import {
  pickedItems,
  pruneSelection,
  summarize,
  type ChecklistGroup,
  type ChecklistSelection,
} from '@/lib/product-checklist';
import { ProductChecklist } from '@/components/product-checklist';
import { AppModal } from '@/components/ui';
import { addProductsToDeliveryAction } from '../actions';
import type { ReceivedCandidate } from '../schema';

/** Añadir recibidos sin entregar del cliente a esta entrega (checklist). */
export function AddProductsDialog({
  open,
  deliveryId,
  categoryName,
  candidates,
  onClose,
}: {
  open: boolean;
  deliveryId: string;
  categoryName: string | null;
  candidates: ReceivedCandidate[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rawSelection, setSelection] = useState<ChecklistSelection>({});

  const groups: ChecklistGroup[] = useMemo(
    () => [
      {
        id: 'all',
        label: categoryName ?? 'Recibidos sin entregar',
        items: candidates.map((p) => ({
          id: p.id,
          name: p.name,
          max: p.available,
          subtitle: `Orden #${p.orderId}${p.categoryName ? ` · ${p.categoryName}` : ''}`,
          href: `/orders/${p.orderId}`,
          meta: `${p.available} disponible${p.available === 1 ? '' : 's'}`,
        })),
      },
    ],
    [candidates, categoryName]
  );
  const selection = useMemo(() => pruneSelection(rawSelection, groups), [rawSelection, groups]);
  const summary = useMemo(() => summarize(groups, selection), [groups, selection]);

  function submit() {
    const items = pickedItems(selection);
    if (items.length === 0) return;
    startTransition(async () => {
      const result = await addProductsToDeliveryAction(deliveryId, items);
      if (result.ok) {
        toast.success('Productos añadidos', {
          description: `${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'}.`,
        });
        setSelection({});
        onClose();
      } else {
        toast.error('No se pudieron añadir', { description: result.error });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Añadir productos a la entrega"
      description="Solo mercancía recibida sin entregar del mismo cliente y categoría."
      icon={<PackagePlus className="h-5 w-5" aria-hidden />}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground">
            {summary.items} producto{summary.items === 1 ? '' : 's'} · {summary.units} unidad
            {summary.units === 1 ? '' : 'es'}
          </p>
          <div className="flex gap-2">
            <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onPress={submit} isDisabled={isPending || summary.units === 0}>
              {isPending ? <Spinner size="sm" color="current" aria-hidden /> : null}
              Añadir
            </Button>
          </div>
        </div>
      }
    >
      <ProductChecklist
        groups={groups}
        value={selection}
        onChange={setSelection}
        emptyMessage="No hay productos recibidos pendientes de entregar para este cliente."
        searchPlaceholder="Buscar producto…"
      />
    </AppModal>
  );
}
