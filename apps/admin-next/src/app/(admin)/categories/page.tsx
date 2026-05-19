import { prisma } from '@/lib/prisma';
import { CategoriesClient } from './categories-client';
import type { CategoryRow } from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const search = q?.trim() ?? '';

  const categories = await prisma.category.findMany({
    where: search
      ? { name: { contains: search, mode: 'insensitive' } }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    shippingCostPerPound: c.shippingCostPerPound,
    clientShippingCharge: c.clientShippingCharge,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <CategoriesClient initialRows={rows} initialQuery={search} />;
}
