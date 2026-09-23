import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getGeneralAdminId } from '@/lib/general-admin';
import { SALES_MANAGER_ROLES, salesManagerLabel } from '@/lib/order-manager';
import { parseId } from '@/lib/action-helpers';
import { ROLES } from '@/lib/roles';
import { NewOrderClient } from './new-order-client';
import type { ClientOption, CurrentUser, SelectOption } from '../schema';

/**
 * Alta de orden con sus productos en la misma vista: agente → cliente →
 * productos en línea con costo en vivo → una sola transacción.
 */
export default async function NewOrderPage() {
  const session = await auth();
  const role = session?.user?.role ?? '';
  if (!(ROLES.orders as readonly string[]).includes(role)) {
    redirect('/orders');
  }
  const currentUser: CurrentUser = { id: session?.user?.id ?? '', role };
  const agentId = role === 'agent' ? parseId(currentUser.id) : null;

  const [clients, managers, shops, categories] = await Promise.all([
    prisma.customUser.findMany({
      where: {
        role: 'client',
        ...(agentId !== null && { assignedAgentId: agentId }),
      },
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
      // ADR-0007: cualquier miembro del personal puede gestionar órdenes.
      where: { role: { in: [...SALES_MANAGER_ROLES] }, isActive: true },
      select: { id: true, name: true, lastName: true, role: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    }),
    prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true, taxRate: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id.toString(),
    label: `${c.name} ${c.lastName}`.trim(),
    phoneNumber: c.phoneNumber,
    agentId: c.assignedAgentId ? c.assignedAgentId.toString() : null,
  }));
  const managerOptions: SelectOption[] = managers.map((m) => ({
    id: m.id.toString(),
    label: salesManagerLabel(`${m.name} ${m.lastName}`, m.role),
  }));
  const defaultManagerId = await getGeneralAdminId();
  const shopOptions: SelectOption[] = shops.map((s) => ({
    id: s.id.toString(),
    label: s.name,
    taxRate: s.taxRate,
  }));
  const categoryOptions: SelectOption[] = categories.map((c) => ({
    id: c.id.toString(),
    label: c.name,
  }));

  return (
    <NewOrderClient
      clientOptions={clientOptions}
      managerOptions={managerOptions}
      defaultManagerId={defaultManagerId}
      shopOptions={shopOptions}
      categoryOptions={categoryOptions}
      currentUser={currentUser}
    />
  );
}
