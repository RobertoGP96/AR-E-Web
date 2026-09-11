import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /products mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={7} search={true} filter={true} pagination={true} />
  );
}
