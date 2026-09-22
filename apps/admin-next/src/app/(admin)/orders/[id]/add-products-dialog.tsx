'use client';

import { useState, useTransition } from 'react';
import { PackagePlus } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { AppModal } from '@/components/ui';
import { addProductsToOrderAction } from '../actions';
import {
  ProductDraftList,
  draftIsComplete,
  draftsTotal,
  newDraft,
  toDraftInput,
  type ProductDraft,
} from '../product-draft-list';
import type { SelectOption } from '../schema';

/** Añadir varios productos a una orden existente con la lista en línea. */
export function AddProductsDialog({
  open,
  orderId,
  shopOptions,
  categoryOptions,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orderId: string;
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<ProductDraft[]>(() => [newDraft()]);
  const ready = drafts.length > 0 && drafts.every(draftIsComplete);
  const total = draftsTotal(drafts);

  function submit() {
    if (!ready) {
      toast.error('Productos incompletos', {
        description: 'Cada producto necesita nombre, tienda, categoría y cantidad.',
      });
      return;
    }
    startTransition(async () => {
      const result = await addProductsToOrderAction({
        orderId,
        products: drafts.map(toDraftInput),
      });
      if (result.ok) {
        const n = drafts.length;
        setDrafts([newDraft()]);
        onSuccess(n);
      } else {
        toast.error('No se pudieron añadir los productos', { description: result.error });
      }
    });
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Añadir productos"
      description="Puedes añadir varios a la vez; el total de la orden se recalcula al guardar."
      icon={<PackagePlus className="h-5 w-5" aria-hidden />}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground">
            {drafts.length} producto{drafts.length === 1 ? '' : 's'} · {formatCurrency(total)}
          </p>
          <div className="flex gap-2">
            <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onPress={submit} isDisabled={isPending || !ready}>
              {isPending ? <Spinner size="sm" color="current" aria-hidden /> : null}
              Añadir
            </Button>
          </div>
        </div>
      }
    >
      <ProductDraftList
        drafts={drafts}
        onChange={setDrafts}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
      />
    </AppModal>
  );
}
