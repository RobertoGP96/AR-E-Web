import {
  CardSkeleton,
  Skeleton,
  StatGridSkeleton,
} from '@/components/ui';

/** Esqueleto del dashboard: saludo + tarjeta de tasa, atajos y métricas. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-8 pb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-[70vw]" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl md:w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <StatGridSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
