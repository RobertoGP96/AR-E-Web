import { prisma } from '@/lib/prisma';
import { ExpensesClient } from './expenses-client';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseRow } from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;
  const search = q?.trim() ?? '';
  const categoryFilter =
    category && (EXPENSE_CATEGORIES as readonly string[]).includes(category)
      ? (category as ExpenseCategory)
      : null;

  const expenses = await prisma.expense.findMany({
    where: {
      ...(search && {
        description: { contains: search, mode: 'insensitive' },
      }),
      ...(categoryFilter && { category: categoryFilter }),
    },
    include: { createdBy: { select: { id: true, name: true, lastName: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

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
    <ExpensesClient
      initialRows={rows}
      initialQuery={search}
      initialCategory={categoryFilter}
      totalAmount={total}
    />
  );
}
