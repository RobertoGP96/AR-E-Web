import { prisma } from '@/lib/prisma';
import { AnalyticsCharts } from './analytics-charts';

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function AnalyticsPage() {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 11);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const [orders, expenses, ordersByStatus, topShops, expensesByCategory] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: {
          createdAt: true,
          receivedValueOfClient: true,
          totalCosts: true,
        },
      }),
      prisma.expense.findMany({
        where: { date: { gte: since } },
        select: { date: true, amount: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['shopId'],
        _count: { _all: true },
        _sum: { totalCost: true },
        orderBy: { _sum: { totalCost: 'desc' } },
        take: 8,
      }),
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
      }),
    ]);

  // Build a 12-month window.
  const months: string[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i += 1) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const monthly = months.map((m) => ({
    month: m,
    revenue: 0,
    cost: 0,
    expenses: 0,
  }));
  const idx = new Map(monthly.map((row, i) => [row.month, i]));

  for (const o of orders) {
    const i = idx.get(monthKey(o.createdAt));
    if (i === undefined) continue;
    monthly[i].revenue += o.receivedValueOfClient;
    monthly[i].cost += o.totalCosts;
  }
  for (const e of expenses) {
    const i = idx.get(monthKey(e.date));
    if (i === undefined) continue;
    monthly[i].expenses += e.amount;
  }
  for (const row of monthly) {
    row.revenue = Math.round(row.revenue * 100) / 100;
    row.cost = Math.round(row.cost * 100) / 100;
    row.expenses = Math.round(row.expenses * 100) / 100;
  }

  const shopIds = topShops.map((s) => s.shopId);
  const shops = await prisma.shop.findMany({
    where: { id: { in: shopIds } },
    select: { id: true, name: true },
  });
  const shopName = new Map(
    shops.map((s) => [s.id.toString(), s.name])
  );

  const statusData = ordersByStatus.map((s) => ({
    name: s.status,
    value: s._count._all,
  }));

  const shopData = topShops.map((s) => ({
    name: shopName.get(s.shopId.toString()) ?? `Shop ${s.shopId}`,
    products: s._count._all,
    cost: Math.round((s._sum.totalCost ?? 0) * 100) / 100,
  }));

  const expenseData = expensesByCategory.map((e) => ({
    name: e.category,
    value: Math.round((e._sum.amount ?? 0) * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last 12 months — revenue vs. cost, order mix, top shops, and
          expense breakdown.
        </p>
      </header>
      <AnalyticsCharts
        monthly={monthly}
        statusData={statusData}
        shopData={shopData}
        expenseData={expenseData}
      />
    </div>
  );
}
