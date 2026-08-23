import { prisma } from '@/lib/prisma';
import { ShopsClient } from './shops-client';
import type { ShopRow } from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ShopsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const search = q?.trim() ?? '';

  const shops = await prisma.shop.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { link: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      buyingAccounts: {
        select: {
          id: true,
          accountName: true,
          _count: { select: { buys: true } },
        },
        orderBy: { accountName: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows: ShopRow[] = shops.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    link: s.link,
    isActive: s.isActive,
    taxRate: s.taxRate,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    accounts: s.buyingAccounts.map((a) => ({
      id: a.id.toString(),
      accountName: a.accountName,
      buysCount: a._count.buys,
    })),
  }));

  return <ShopsClient initialRows={rows} initialQuery={search} />;
}
