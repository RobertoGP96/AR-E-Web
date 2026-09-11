import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /balance mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={8} search={false} filter={false} pagination={false} />
  );
}
