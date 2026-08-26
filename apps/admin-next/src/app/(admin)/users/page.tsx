import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { UsersClient } from './users-client';
import { DistributionClient } from './distribution-client';
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

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    role?: string;
    active?: string;
    verified?: string;
    page?: string;
    per?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    // Only admins manage users in this app.
    redirect('/dashboard');
  }

  const { tab: tabParam, q, role, active, verified, page: pageParam, per } =
    await searchParams;
  const tab: UsersTab = tabParam === 'distribution' ? 'distribution' : 'users';

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
        usersPanel={null}
        distributionPanel={
          <DistributionClient agents={agentRows} clients={clientRows} />
        }
      />
    );
  }

  const search = q?.trim() ?? '';
  const roleFilter =
    role && (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
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
    />
  );
}
