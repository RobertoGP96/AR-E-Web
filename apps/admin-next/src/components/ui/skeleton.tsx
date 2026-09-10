import { cn } from '@heroui/react';

/**
 * Bloques de esqueleto para los `loading.tsx` del panel: mismas formas
 * que PageHeader / StatCard / surface-card, en gris pulsante. Se pintan
 * al instante en la navegación mientras el servidor consulta la BD.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-default', className)}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64 max-w-[60vw]" />
      </div>
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('surface-card space-y-3 p-5', className)}>
      <Skeleton className="h-4 w-36" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Página genérica: cabecera + tarjeta de contenido. */
export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="pb-8">
      <PageHeaderSkeleton />
      <CardSkeleton rows={rows} />
    </div>
  );
}
