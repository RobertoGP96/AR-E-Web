import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PackagesClient } from '../packages-client';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import type { PackageRow, PackageStatus } from '../schema';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    per?: string;
  }>;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const { q, status, page: pageParam, per } = await searchParams;
  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const search = q?.trim() ?? '';
  const statusFilter =
    status === 'Enviado' || status === 'Recibido' || status === 'Procesado'
      ? (status as PackageStatus)
      : null;

  const where = {
    ...(search && {
      OR: [
        { agencyName: { contains: search, mode: 'insensitive' as const } },
        {
          numberOfTracking: { contains: search, mode: 'insensitive' as const },
        },
      ],
    }),
    ...(statusFilter && { statusOfProcessing: statusFilter }),
  };

  const [packages, totalCount] = await Promise.all([
    prisma.package.findMany({
      where,
      include: { _count: { select: { packageProducts: true } } },
      orderBy: [{ arrivalDate: 'desc' }, { id: 'desc' }],
      skip,
      take: perPage,
    }),
    prisma.package.count({ where }),
  ]);

  const rows: PackageRow[] = packages.map((p) => ({
    id: p.id.toString(),
    agencyName: p.agencyName,
    numberOfTracking: p.numberOfTracking,
    statusOfProcessing: p.statusOfProcessing as PackageStatus,
    arrivalDate: p.arrivalDate.toISOString(),
    packagePicture: p.packagePicture,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    receptionCount: p._count.packageProducts,
  }));
  const session = await auth();
  const role = session?.user?.role ?? '';

  return (
    <>
      <PackagesClient
        initialRows={rows}
        initialQuery={search}
        initialStatus={statusFilter}
        role={role}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
