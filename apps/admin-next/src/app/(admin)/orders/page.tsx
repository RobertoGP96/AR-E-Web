import { prisma } from '@/lib/prisma';
import { OrdersClient } from './orders-client';
import {
  ORDER_STATUSES,
  PAY_STATUSES,
  fromDbPayStatus,
  toDbPayStatus,
  type DbPayStatus,
  type OrderRow,
  type OrderStatus,
  type PayStatus,
  type SelectOption,
} from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; pay?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const { q, status, pay } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (ORDER_STATUSES as readonly string[]).includes(status)
      ? (status as OrderStatus)
      : null;
  const payFilter =
    pay && (PAY_STATUSES as readonly string[]).includes(pay)
      ? (pay as PayStatus)
      : null;

  const [orders, clients, managers] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(statusFilter && { status: statusFilter }),
        ...(payFilter && { payStatus: toDbPayStatus(payFilter) }),
        ...(search && {
          client: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        client: { select: { name: true, lastName: true } },
        salesManager: { select: { name: true, lastName: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.customUser.findMany({
      where: { role: 'client' },
      select: { id: true, name: true, lastName: true, phoneNumber: true },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    prisma.customUser.findMany({
      where: { role: { in: ['agent', 'admin'] }, isActive: true },
      select: { id: true, name: true, lastName: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id.toString(),
    clientId: o.clientId.toString(),
    clientName: `${o.client.name} ${o.client.lastName}`.trim(),
    salesManagerName: o.salesManager
      ? `${o.salesManager.name} ${o.salesManager.lastName}`.trim()
      : null,
    status: o.status as OrderStatus,
    payStatus: fromDbPayStatus(o.payStatus as DbPayStatus),
    totalCosts: o.totalCosts,
    receivedValueOfClient: o.receivedValueOfClient,
    balanceApplied: o.balanceApplied,
    productCount: o._count.products,
    observations: o.observations,
    createdAt: o.createdAt.toISOString(),
  }));

  const clientOptions: SelectOption[] = clients.map((c) => ({
    id: c.id.toString(),
    label: `${c.name} ${c.lastName} · ${c.phoneNumber}`.trim(),
  }));
  const managerOptions: SelectOption[] = managers.map((m) => ({
    id: m.id.toString(),
    label: `${m.name} ${m.lastName}`.trim(),
  }));

  return (
    <OrdersClient
      initialRows={rows}
      clientOptions={clientOptions}
      managerOptions={managerOptions}
      initialFilters={{ q: search, status: statusFilter, pay: payFilter }}
    />
  );
}
