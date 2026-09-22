'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui';
import { recomputeAllProductsAction } from '../actions';

/**
 * Acciones de mantenimiento del admin: recalcular cantidades y estado
 * de todos los productos con la regla vigente (RN-010/RN-011).
 */
export function MaintenanceActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">
        Recalcula las cantidades compradas, recibidas y entregadas de todos
        los productos y su estado. Úsalo tras un despliegue que cambie la
        regla de estados o tras una limpieza de datos.
      </p>
      <Button variant="tertiary" onPress={() => setOpen(true)} className="w-full sm:w-auto">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Recalcular estados de productos
      </Button>

      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        tone="accent"
        title="¿Recalcular todos los productos?"
        description="Se recorren todos los productos y se recalculan sus cantidades y estado. Puede tardar unos segundos; no borra datos."
        confirmLabel="Recalcular"
        onConfirm={async () => {
          const result = await recomputeAllProductsAction();
          if (result.ok) {
            const c = result.counts;
            toast.success('Estados recalculados', {
              description: `Encargado ${c.Encargado} · Comprado ${c.Comprado} · Recibido ${c.Recibido} · Entregado ${c.Entregado}.`,
            });
            setOpen(false);
          }
          return result;
        }}
      />
    </div>
  );
}
