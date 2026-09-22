'use client';

import { useState, useTransition } from 'react';
import { Tag } from 'lucide-react';
import { Button, Popover, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { Field, Select } from '@/components/ui';
import { assignProductCategoryAction } from '@/app/(admin)/products/actions';

/**
 * Asignación rápida de categoría a un producto que la tiene vacía
 * (INV-002): desbloquea recibirlo/embolsarlo sin ir a la orden.
 */
export function AssignCategoryPopover({
  productId,
  productName,
  categories,
  onAssigned,
}: {
  productId: string;
  productName: string;
  categories: { id: string; label: string }[];
  onAssigned?: (categoryId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [isPending, startTransition] = useTransition();

  function assign() {
    if (!categoryId) return;
    startTransition(async () => {
      const result = await assignProductCategoryAction(productId, categoryId);
      if (result.ok) {
        const label = categories.find((c) => c.id === categoryId)?.label ?? '';
        toast.success('Categoría asignada', {
          description: `«${productName}» → ${label}.`,
        });
        setOpen(false);
        onAssigned?.(categoryId);
      } else {
        toast.error('No se pudo asignar la categoría', {
          description: result.error,
        });
      }
    });
  }

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" aria-label={`Asignar categoría a ${productName}`}>
        <Tag className="h-3.5 w-3.5" aria-hidden />
        Asignar categoría
      </Button>
      <Popover.Content
        placement="bottom end"
        className="w-[min(280px,calc(100vw-2rem))]"
      >
        <Popover.Dialog className="p-4">
          <Popover.Heading className="text-sm font-semibold text-foreground">
            Categoría de «{productName}»
          </Popover.Heading>
          <p className="mt-0.5 text-xs text-muted">
            Decide en qué bolsa cae y la tarifa por libra de su entrega.
          </p>
          <div className="mt-3">
            <Field label="Categoría" required>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— Selecciona —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2 border-t border-separator pt-3">
            <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={assign}
              isDisabled={!categoryId || isPending}
            >
              {isPending ? <Spinner size="sm" color="current" aria-hidden /> : null}
              Asignar
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
