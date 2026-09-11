import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /orders mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={8} search={true} filter={true} pagination={true} />
  );
}
