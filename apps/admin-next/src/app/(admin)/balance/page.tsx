import { prisma } from '@/lib/prisma';
import { BalanceClient } from './balance-client';
import type { BalanceRow } from './schema';

export default async function BalancePage() {
  const balances = await prisma.balance.findMany({
    orderBy: { startDate: 'desc' },
    take: 100,
  });

  const rows: BalanceRow[] = balances.map((b) => ({
    id: b.id.toString(),
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    systemWeight: Number(b.systemWeight),
    registeredWeight: Number(b.registeredWeight),
    revenues: Number(b.revenues),
    buysCosts: Number(b.buysCosts),
    costs: Number(b.costs),
    expenses: Number(b.expenses),
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return <BalanceClient initialRows={rows} />;
}
