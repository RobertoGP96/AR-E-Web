import { LineChart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui';
import { AnalyticsCharts } from './analytics-charts';

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function AnalyticsPage() {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 11);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const [
    orders,
    deliveries,
    purchases,
    expenses,
    common,
    ordersByStatus,
    topShops,
    expensesByCategory,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        receivedValueOfClient: true,
        totalCosts: true,
      },
    }),
    prisma.deliverReceip.findMany({
      where: { deliverDate: { gte: since } },
      select: {
        deliverDate: true,
        paymentAmount: true,
        weight: true,
        managerProfit: true,
      },
    }),
    prisma.shoppingReceip.findMany({
      where: { buyDate: { gte: since } },
      select: { buyDate: true, totalCostOfPurchase: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: since } },
      select: { date: true, amount: true },
    }),
    prisma.commonInformation.findFirst({ orderBy: { id: 'asc' } }),
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

  const costPerPound = common?.costPerPound ?? 0;

  // Build a 12-month window with the 5 series the Vite Analytics uses.
  const months: string[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i += 1) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const monthly = months.map((m) => {
    const [y, mm] = m.split('-').map(Number);
    return {
      month: m,
      month_short: new Date(Date.UTC(y, mm - 1, 1)).toLocaleString('es-ES', {
        month: 'short',
        timeZone: 'UTC',
      }),
      revenue: 0,
      system_profit: 0,
      agent_profits: 0,
      product_expenses: 0,
      delivery_expenses: 0,
    };
  });
  const idx = new Map(monthly.map((row, i) => [row.month, i]));

  for (const o of orders) {
    const i = idx.get(monthKey(o.createdAt));
    if (i === undefined) continue;
    monthly[i].revenue += o.receivedValueOfClient;
  }
  for (const d of deliveries) {
    const i = idx.get(monthKey(d.deliverDate));
    if (i === undefined) continue;
    monthly[i].revenue += d.paymentAmount;
    monthly[i].agent_profits += d.managerProfit;
    monthly[i].delivery_expenses += d.weight * costPerPound;
  }
  for (const p of purchases) {
    const i = idx.get(monthKey(p.buyDate));
    if (i === undefined) continue;
    monthly[i].product_expenses += p.totalCostOfPurchase;
  }
  for (const e of expenses) {
    const i = idx.get(monthKey(e.date));
    if (i === undefined) continue;
    monthly[i].product_expenses += e.amount;
  }
  for (const row of monthly) {
    row.system_profit =
      row.revenue -
      row.product_expenses -
      row.delivery_expenses -
      row.agent_profits;
    row.revenue = Math.round(row.revenue * 100) / 100;
    row.system_profit = Math.round(row.system_profit * 100) / 100;
    row.agent_profits = Math.round(row.agent_profits * 100) / 100;
    row.product_expenses = Math.round(row.product_expenses * 100) / 100;
    row.delivery_expenses = Math.round(row.delivery_expenses * 100) / 100;
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
      <PageHeader
        icon={LineChart}
        title="Reportes de Ganancias"
        subtitle="Evolución de ingresos, costos y ganancias de los últimos 12 meses"
      />
      <AnalyticsCharts
        monthly={monthly}
        statusData={statusData}
        shopData={shopData}
        expenseData={expenseData}
      />
    </div>
  );
}
