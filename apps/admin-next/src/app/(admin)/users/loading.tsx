import {
  PageHeaderSkeleton,
  PaginationSkeleton,
  Skeleton,
  TableSkeleton,
  ToolbarSkeleton,
} from '@/components/ui';

/** Esqueleto de /users: cabecera, pestañas, toolbar y tabla. */
export default function UsersLoading() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-5 pb-8">
      <PageHeaderSkeleton className="mb-0" />
      <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
      <ToolbarSkeleton />
      <TableSkeleton columns={7} />
      <PaginationSkeleton />
    </div>
  );
}
