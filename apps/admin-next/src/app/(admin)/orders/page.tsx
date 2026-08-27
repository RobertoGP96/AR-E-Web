import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OrdersClient } from './orders-client';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import {
  ORDER_STATUSES,
  PAY_STATUSES,
  fromDbPayStatus,
  toDbPayStatus,
  type ClientOption,
  type CurrentUser,
  type DbPayStatus,
  type OrderRow,
  type OrderStatus,
  type PayStatus,
  type SelectOption,
} from './schema';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    pay?: string;
    manager?: string;
    from?: string;
    to?: string;
    page?: string;
    per?: string;
  }>;
}

/** Valida un parámetro YYYY-MM-DD de la URL; cualquier otra cosa se ignora. */
function parseDateParam(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? null : value;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth();
  const currentUser: CurrentUser = {
    id: session?.user.id ?? '',
    role: session?.user.role ?? '',
  };
  const {
    q,
    status,
    pay,
    manager,
    from,
    to,
    page: pageParam,
    per,
  } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (ORDER_STATUSES as readonly string[]).includes(status)
      ? (status as OrderStatus)
      : null;
  const payFilter =
    pay && (PAY_STATUSES as readonly string[]).includes(pay)
      ? (pay as PayStatus)
      : null;
  const managerFilter =
    manager && (manager === 'none' || /^\d+$/.test(manager)) ? manager : null;
  const fromFilter = parseDateParam(from);
  const toFilter = parseDateParam(to);

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where: Prisma.OrderWhereInput = {
    ...(statusFilter && { status: statusFilter }),
    ...(payFilter && { payStatus: toDbPayStatus(payFilter) }),
    ...(managerFilter && {
      salesManagerId: managerFilter === 'none' ? null : BigInt(managerFilter),
    }),
    ...((fromFilter || toFilter) && {
      createdAt: {
        ...(fromFilter && { gte: new Date(`${fromFilter}T00:00:00`) }),
        ...(toFilter && { lte: new Date(`${toFilter}T23:59:59.999`) }),
      },
    }),
    ...(search && {
      client: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
  };

  const [orders, clients, managers, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        client: { select: { name: true, lastName: true, balance: true } },
        salesManager: { select: { name: true, lastName: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.customUser.findMany({
      where: { role: 'client' },
      select: {
        id: true,
        name: true,
        lastName: true,
        phoneNumber: true,
        assignedAgentId: true,
      },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    prisma.customUser.findMany({
      where: { role: { in: ['agent', 'admin'] }, isActive: true },
      select: { id: true, name: true, lastName: true },
      orderBy: { name: 'asc' },
    }),
    prisma.order.count({ where }),
  ]);

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id.toString(),
    clientId: o.clientId.toString(),
    clientBalance: o.client.balance,
    clientName: `${o.client.name} ${o.client.lastName}`.trim(),
    salesManagerId: o.salesManagerId ? o.salesManagerId.toString() : null,
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

  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id.toString(),
    label: `${c.name} ${c.lastName}`.trim(),
    phoneNumber: c.phoneNumber,
    agentId: c.assignedAgentId ? c.assignedAgentId.toString() : null,
  }));
  const managerOptions: SelectOption[] = managers.map((m) => ({
    id: m.id.toString(),
    label: `${m.name} ${m.lastName}`.trim(),
  }));

  return (
    <>
      <OrdersClient
        initialRows={rows}
        clientOptions={clientOptions}
        managerOptions={managerOptions}
        currentUser={currentUser}
        initialFilters={{
          q: search,
          status: statusFilter,
          pay: payFilter,
          manager: managerFilter,
          from: fromFilter,
          to: toFilter,
        }}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
