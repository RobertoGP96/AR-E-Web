import {
  CardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/components/ui';

/** Esqueleto de la mesa de preparación: cabecera, tabs y dos paneles. */
export default function PrepareLoading() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-6 pb-8">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-72 max-w-full rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <CardSkeleton rows={6} />
        <CardSkeleton rows={8} />
      </div>
    </div>
  );
}
