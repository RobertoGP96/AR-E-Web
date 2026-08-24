import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { ExpensesClient } from './expenses-client';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseRow } from './schema';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    per?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const { q, category, page: pageParam, per } = await searchParams;
  const search = q?.trim() ?? '';
  const categoryFilter =
    category && (EXPENSE_CATEGORIES as readonly string[]).includes(category)
      ? (category as ExpenseCategory)
      : null;

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where: Prisma.ExpenseWhereInput = {
    ...(search && {
      description: { contains: search, mode: 'insensitive' },
    }),
    ...(categoryFilter && { category: categoryFilter }),
  };

  const [expenses, totalCount, totalAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  const total = totalAgg._sum.amount ?? 0;

  const rows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id.toString(),
    date: e.date.toISOString(),
    amount: e.amount,
    category: e.category as ExpenseCategory,
    description: e.description,
    createdById: e.createdBy ? e.createdBy.id.toString() : null,
    createdByName: e.createdBy
      ? `${e.createdBy.name} ${e.createdBy.lastName}`.trim()
      : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <>
      <ExpensesClient
        initialRows={rows}
        initialQuery={search}
        initialCategory={categoryFilter}
        totalAmount={total}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
