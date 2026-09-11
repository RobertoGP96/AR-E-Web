import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /purchases mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={7} search={false} filter={true} pagination={true} />
  );
}
