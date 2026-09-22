'use client';

import { useState } from 'react';
import { ClipboardCheck, RotateCcw } from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui';
import { packageActionsFor, type PackageAction } from '@/lib/package-status';
import { transitionPackageStatusAction } from './actions';

/**
 * Transiciones explícitas de estado del paquete (INV-006): «Terminar
 * revisión» y «Reabrir» (admin). No hay select libre de estado.
 */
export function PackageActionsBar({
  packageId,
  tracking,
  status,
  role,
  receptionCount,
  compact = false,
}: {
  packageId: string;
  tracking: string;
  status: string;
  role: string;
  receptionCount: number;
  compact?: boolean;
}) {
  const [pending, setPending] = useState<PackageAction | null>(null);
  const actions = packageActionsFor(status, role);
  if (actions.length === 0) return null;

  const current = actions.find((a) => a.action === pending) ?? null;

  return (
    <>
      <div className={`flex gap-2 ${compact ? '' : 'grid grid-cols-2 sm:flex'}`}>
        {actions.map((a) => (
          <Button
            key={a.action}
            variant={a.action === 'finish' ? 'primary' : 'tertiary'}
            size={compact ? 'sm' : 'md'}
            onPress={() => setPending(a.action)}
            className={compact ? '' : 'h-11 sm:h-auto'}
          >
            {a.action === 'finish' ? (
              <ClipboardCheck className="h-4 w-4" aria-hidden />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden />
            )}
            {a.label}
          </Button>
        ))}
      </div>

      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        tone="accent"
        title={
          pending === 'finish'
            ? '¿Terminar la revisión del paquete?'
            : '¿Reabrir la revisión?'
        }
        description={
          pending === 'finish' ? (
            <>
              <strong className="text-foreground">{tracking}</strong> se marcará
              como <strong className="text-foreground">Procesado</strong>
              {receptionCount === 0
                ? ' sin ninguna llegada marcada'
                : ` con ${receptionCount} recepción${receptionCount === 1 ? '' : 'es'}`}
              . Los productos que no marcaste seguirán pendientes de llegada
              para otro paquete.
            </>
          ) : (
            <>
              <strong className="text-foreground">{tracking}</strong> volverá a{' '}
              <strong className="text-foreground">Recibido</strong> y se podrán
              marcar más llegadas.
            </>
          )
        }
        confirmLabel={current?.label ?? 'Confirmar'}
        onConfirm={async () => {
          if (!pending) return { ok: false, error: 'Acción no encontrada' };
          const result = await transitionPackageStatusAction(packageId, pending);
          if (result.ok) {
            toast.success(
              pending === 'finish' ? 'Paquete procesado' : 'Revisión reabierta',
              { description: `${tracking} · ${current?.to ?? ''}.` }
            );
            setPending(null);
          }
          return result;
        }}
      />
    </>
  );
}
