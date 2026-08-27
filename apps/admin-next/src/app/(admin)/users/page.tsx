import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { UsersClient } from './users-client';
import { DistributionClient } from './distribution-client';
import {
  BalancesClient,
  type BalanceStatusFilter,
  type ClientBalanceRow,
} from './balances-client';
import { UsersTabs, type UsersTab } from './users-tabs';
import {
  CLIENT_ROLES,
  USER_ROLES,
  type AgentOption,
  type DistAgentRow,
  type DistClientRow,
  type UserRole,
  type UserRow,
} from './schema';

const BALANCE_STATUS_FILTERS = ['deuda', 'favor', 'aldia'] as const;

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    role?: string;
    active?: string;
    verified?: string;
    status?: string;
    page?: string;
    per?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await auth();
  const sessionRole = session?.user.role;
  // Admins manage users; accountants only get the balances tab (the
  // former /client-balances view now lives here).
  if (sessionRole !== 'admin' && sessionRole !== 'accountant') {
    redirect('/dashboard');
  }
  const canManageUsers = sessionRole === 'admin';

  const {
    tab: tabParam,
    q,
    role: roleParam,
    active,
    verified,
    status,
    page: pageParam,
    per,
  } = await searchParams;
  let tab: UsersTab =
    tabParam === 'distribution'
      ? 'distribution'
      : tabParam === 'balances'
        ? 'balances'
        : 'users';
  if (!canManageUsers) tab = 'balances';

  const search = q?.trim() ?? '';

  if (tab === 'balances') {
    const statusFilter =
      status && (BALANCE_STATUS_FILTERS as readonly string[]).includes(status)
        ? (status as BalanceStatusFilter)
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
      <UsersTabs
        tab="balances"
        agentOptions={[]}
        canManageUsers={canManageUsers}
        usersPanel={null}
        distributionPanel={null}
        balancesPanel={
          <BalancesClient
            initialRows={rows}
            totals={totals}
            initialFilters={{ q: search, status: statusFilter }}
          />
        }
      />
    );
  }

  const agentsQuery = prisma.customUser.findMany({
    where: { role: { in: ['agent', 'admin'] }, isActive: true },
    select: { id: true, name: true, lastName: true, role: true },
    orderBy: { name: 'asc' },
  });

  if (tab === 'distribution') {
    // Include inactive/off-role users that still hold clients so no
    // assignment is invisible in the distribution view.
    const [agents, clients, holders] = await Promise.all([
      agentsQuery,
      prisma.customUser.findMany({
        where: { role: { in: [...CLIENT_ROLES] } },
        select: {
          id: true,
          name: true,
          lastName: true,
          phoneNumber: true,
          email: true,
          isActive: true,
          assignedAgentId: true,
        },
        orderBy: [{ name: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.customUser.findMany({
        where: {
          OR: [
            { role: { in: ['agent', 'admin'] }, isActive: true },
            { assignedClients: { some: { role: { in: [...CLIENT_ROLES] } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          role: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);
    const agentOptions: AgentOption[] = agents.map((a) => ({
      id: a.id.toString(),
      label: `${a.name} ${a.lastName}`.trim(),
      role: a.role as UserRole,
    }));

    const counts = new Map<string, number>();
    const clientRows: DistClientRow[] = clients.map((c) => {
      const agentId = c.assignedAgentId ? c.assignedAgentId.toString() : null;
      if (agentId) counts.set(agentId, (counts.get(agentId) ?? 0) + 1);
      return {
        id: c.id.toString(),
        name: c.name,
        lastName: c.lastName,
        phoneNumber: c.phoneNumber,
        email: c.email,
        isActive: c.isActive,
        assignedAgentId: agentId,
      };
    });

    const agentRows: DistAgentRow[] = holders
      .map((a) => {
        const id = a.id.toString();
        return {
          id,
          label: `${a.name} ${a.lastName}`.trim(),
          role: a.role as UserRole,
          isActive: a.isActive,
          clientCount: counts.get(id) ?? 0,
        };
      })
      .sort((a, b) => b.clientCount - a.clientCount);

    return (
      <UsersTabs
        tab={tab}
        agentOptions={agentOptions}
        canManageUsers={canManageUsers}
        usersPanel={null}
        distributionPanel={
          <DistributionClient agents={agentRows} clients={clientRows} />
        }
        balancesPanel={null}
      />
    );
  }

  const roleFilter =
    roleParam && (USER_ROLES as readonly string[]).includes(roleParam)
      ? (roleParam as UserRole)
      : null;
  const activeFilter =
    active === 'true' ? true : active === 'false' ? false : null;
  const verifiedFilter =
    verified === 'true' ? true : verified === 'false' ? false : null;
  const { page, perPage, skip } = parsePagination({ page: pageParam, per });

  const where: Prisma.CustomUserWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(roleFilter && { role: roleFilter }),
    ...(activeFilter !== null && { isActive: activeFilter }),
    ...(verifiedFilter !== null && { isVerified: verifiedFilter }),
  };

  const [agents, users, totalCount] = await Promise.all([
    agentsQuery,
    prisma.customUser.findMany({
      where,
      include: {
        assignedAgent: { select: { name: true, lastName: true } },
      },
      orderBy: { dateJoined: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.customUser.count({ where }),
  ]);
  const agentOptions: AgentOption[] = agents.map((a) => ({
    id: a.id.toString(),
    label: `${a.name} ${a.lastName}`.trim(),
    role: a.role as UserRole,
  }));

  const rows: UserRow[] = users.map((u) => ({
    id: u.id.toString(),
    name: u.name,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    homeAddress: u.homeAddress,
    role: u.role as UserRole,
    agentProfit: u.agentProfit,
    balance: u.balance,
    assignedAgentId: u.assignedAgentId ? u.assignedAgentId.toString() : null,
    assignedAgentName: u.assignedAgent
      ? `${u.assignedAgent.name} ${u.assignedAgent.lastName}`.trim()
      : null,
    isActive: u.isActive,
    isVerified: u.isVerified,
    dateJoined: u.dateJoined.toISOString(),
  }));

  return (
    <UsersTabs
      tab={tab}
      agentOptions={agentOptions}
      canManageUsers={canManageUsers}
      usersPanel={
        <>
          <UsersClient
            initialRows={rows}
            agentOptions={agentOptions}
            initialFilters={{
              q: search,
              role: roleFilter,
              active: activeFilter,
              verified: verifiedFilter,
            }}
          />
          <TablePagination page={page} perPage={perPage} total={totalCount} />
        </>
      }
      distributionPanel={null}
      balancesPanel={null}
    />
  );
}
