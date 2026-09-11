import { ListPageSkeleton } from '@/components/ui';

/** Esqueleto de /invoices mientras el servidor consulta la BD. */
export default function Loading() {
  return (
    <ListPageSkeleton columns={5} search={false} filter={false} pagination={true} />
  );
}
