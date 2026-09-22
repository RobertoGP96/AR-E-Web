import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseId } from '@/lib/action-helpers';
import { ROLES } from '@/lib/roles';
import { PackageDetailClient } from './package-detail-client';
import {
  loadArrivalCandidates,
  loadCategoryChoices,
  loadReceptions,
} from '../queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  let packageId: bigint;
  try {
    packageId = BigInt(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const role = session?.user?.role ?? '';
  const canWrite = (ROLES.packages as readonly string[]).includes(role);
  const agentId = role === 'agent' ? parseId(session?.user?.id ?? '') : null;

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) notFound();

  const [receptions, arrivals, categories] = await Promise.all([
    loadReceptions([packageId]),
    loadArrivalCandidates({ agentId }),
    loadCategoryChoices(),
  ]);

  return (
    <PackageDetailClient
      role={role}
      canWrite={canWrite}
      pkg={{
        id: pkg.id.toString(),
        agency: pkg.agencyName,
        tracking: pkg.numberOfTracking,
        status: pkg.statusOfProcessing,
        arrivalDate: pkg.arrivalDate.toISOString(),
        packagePicture: pkg.packagePicture,
        receptions: receptions.get(pkg.id.toString()) ?? [],
        unitsMarked: (receptions.get(pkg.id.toString()) ?? []).reduce(
          (s, r) => s + r.amount,
          0
        ),
      }}
      candidates={arrivals.candidates}
      truncated={arrivals.truncated}
      categories={categories}
    />
  );
}
