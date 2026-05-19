import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UsersClient } from './users-client';
import {
  USER_ROLES,
  type AgentOption,
  type UserRole,
  type UserRow,
} from './schema';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    active?: string;
    verified?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    // Only admins manage users in this app.
    redirect('/dashboard');
  }

  const { q, role, active, verified } = await searchParams;
  const search = q?.trim() ?? '';
  const roleFilter =
    role && (USER_ROLES as readonly string[]).includes(role)
      ? (role as UserRole)
      : null;
  const activeFilter =
    active === 'true' ? true : active === 'false' ? false : null;
  const verifiedFilter =
    verified === 'true' ? true : verified === 'false' ? false : null;

  const [users, agents] = await Promise.all([
    prisma.customUser.findMany({
      where: {
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
      },
      include: {
        assignedAgent: { select: { name: true, lastName: true } },
      },
      orderBy: { dateJoined: 'desc' },
      take: 200,
    }),
    prisma.customUser.findMany({
      where: { role: { in: ['agent', 'admin'] }, isActive: true },
      select: { id: true, name: true, lastName: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

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

  const agentOptions: AgentOption[] = agents.map((a) => ({
    id: a.id.toString(),
    label: `${a.name} ${a.lastName}`.trim(),
    role: a.role as UserRole,
  }));

  return (
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
  );
}
