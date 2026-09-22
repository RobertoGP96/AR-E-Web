import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { parseId } from '@/lib/action-helpers';
import { ROLES } from '@/lib/roles';
import { NewPackageClient } from './new-package-client';
import { loadArrivalCandidates, loadCategoryChoices } from '../queries';

/**
 * Alta de paquete con sus llegadas en la misma vista (ADR-0003): datos
 * del bulto + checklist de lo que llegó → una sola transacción.
 */
export default async function NewPackagePage() {
  const session = await auth();
  const role = session?.user?.role ?? '';
  if (!(ROLES.packages as readonly string[]).includes(role)) {
    redirect('/packages');
  }
  const agentId = role === 'agent' ? parseId(session?.user?.id ?? '') : null;

  const [arrivals, categories] = await Promise.all([
    loadArrivalCandidates({ agentId }),
    loadCategoryChoices(),
  ]);

  return (
    <NewPackageClient
      candidates={arrivals.candidates}
      truncated={arrivals.truncated}
      categories={categories}
    />
  );
}
