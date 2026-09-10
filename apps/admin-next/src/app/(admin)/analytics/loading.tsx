import {
  CardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  StatGridSkeleton,
} from '@/components/ui';

/** Esqueleto de /analytics: cabecera, KPIs, gráfico principal y rankings. */
export default function AnalyticsLoading() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-6 pb-8">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
