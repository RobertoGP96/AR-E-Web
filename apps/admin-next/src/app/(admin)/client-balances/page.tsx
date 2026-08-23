import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { ClientBalancesClient, type ClientBalanceRow } from './client-balances-client';

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const STATUS_FILTERS = ['deuda', 'favor', 'aldia'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default async function ClientBalancesPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (STATUS_FILTERS as readonly string[]).includes(status)
      ? (status as StatusFilter)
      : null;

  const [clients, orderAgg, deliveryAgg] = await Promise.all([
    prisma.customUser.findMany({
      where: {
        role: 'client',
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            {
              phoneNumber: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        phoneNumber: true,
        balance: true,
        assignedAgent: { select: { name: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    prisma.order.groupBy({
      by: ['clientId'],
      _sum: { receivedValueOfClient: true, totalCosts: true },
      _count: { _all: true },
    }),
    prisma.deliverReceip.groupBy({
      by: ['clientId'],
      _sum: { paymentAmount: true, weightCost: true },
      _count: { _all: true },
    }),
  ]);

  const orderByClient = new Map(
    orderAgg.map((a) => [a.clientId.toString(), a])
  );
  const deliveryByClient = new Map(
    deliveryAgg.map((a) => [a.clientId.toString(), a])
  );

  let rows: ClientBalanceRow[] = clients.map((c) => {
    const key = c.id.toString();
    const o = orderByClient.get(key);
    const d = deliveryByClient.get(key);
    const received =
      (o?._sum.receivedValueOfClient ?? 0) + (d?._sum.paymentAmount ?? 0);
    const cost = (o?._sum.totalCosts ?? 0) + (d?._sum.weightCost ?? 0);
    return {
      id: key,
      name: `${c.name} ${c.lastName}`.trim(),
      phoneNumber: c.phoneNumber,
      agentName: c.assignedAgent
        ? `${c.assignedAgent.name} ${c.assignedAgent.lastName}`.trim()
        : null,
      orderCount: o?._count._all ?? 0,
      deliveryCount: d?._count._all ?? 0,
      totalReceived: round2(received),
      totalCost: round2(cost),
      // Same formula as CustomUser.recalculate_balance; the live
      // aggregate is the source of truth, the stored column can lag.
      balance: round2(received - cost),
      storedBalance: c.balance,
    };
  });

  if (statusFilter) {
    rows = rows.filter((r) =>
      statusFilter === 'deuda'
        ? r.balance < 0
        : statusFilter === 'favor'
          ? r.balance > 0
          : r.balance === 0
    );
  }

  // Biggest debt first — that's what the accountant is here for.
  rows.sort((a, b) => a.balance - b.balance);

  const totals = {
    debt: round2(
      rows.filter((r) => r.balance < 0).reduce((s, r) => s + r.balance, 0)
    ),
    credit: round2(
      rows.filter((r) => r.balance > 0).reduce((s, r) => s + r.balance, 0)
    ),
    clients: rows.length,
  };

  return (
    <ClientBalancesClient
      initialRows={rows}
      totals={totals}
      initialFilters={{ q: search, status: statusFilter }}
    />
  );
}
