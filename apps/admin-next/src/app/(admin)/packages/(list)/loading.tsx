import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /packages mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={6} search={true} filter={true} pagination={true} />
  );
}
