import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /delivery mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={8} search={true} filter={true} pagination={true} />
  );
}
