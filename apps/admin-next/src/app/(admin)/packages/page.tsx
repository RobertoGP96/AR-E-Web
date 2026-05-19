import { prisma } from '@/lib/prisma';
import { PackagesClient } from './packages-client';
import type { PackageRow, PackageStatus } from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status === 'Enviado' || status === 'Recibido' || status === 'Procesado'
      ? (status as PackageStatus)
      : null;

  const packages = await prisma.package.findMany({
    where: {
      ...(search && {
        OR: [
          { agencyName: { contains: search, mode: 'insensitive' } },
          { numberOfTracking: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(statusFilter && { statusOfProcessing: statusFilter }),
    },
    orderBy: { arrivalDate: 'desc' },
  });

  const rows: PackageRow[] = packages.map((p) => ({
    id: p.id.toString(),
    agencyName: p.agencyName,
    numberOfTracking: p.numberOfTracking,
    statusOfProcessing: p.statusOfProcessing as PackageStatus,
    arrivalDate: p.arrivalDate.toISOString(),
    packagePicture: p.packagePicture,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <PackagesClient
      initialRows={rows}
      initialQuery={search}
      initialStatus={statusFilter}
    />
  );
}
