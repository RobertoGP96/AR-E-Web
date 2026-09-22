import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseId } from '@/lib/action-helpers';
import { ROLES } from '@/lib/roles';
import { NewDeliveryClient } from './new-delivery-client';
import type { ClientOption } from '../schema';

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

/**
 * «Armar entrega desde recibidos» (ADR-0004) como página: cliente →
 * checklist de sus recibidos sin entregar por categoría → peso por
 * categoría (opcional) → una sola transacción llena y cierra las bolsas.
 */
export default async function NewDeliveryPage({ searchParams }: PageProps) {
  const { client } = await searchParams;
  const session = await auth();
  const role = session?.user?.role ?? '';
  if (!(ROLES.delivery as readonly string[]).includes(role)) {
    redirect('/delivery');
  }
  const agentId = role === 'agent' ? parseId(session?.user?.id ?? '') : null;

  const clients = await prisma.customUser.findMany({
    where: {
      role: 'client',
      ...(agentId !== null && { assignedAgentId: agentId }),
      // Solo clientes con mercancía recibida sin entregar.
      orders: {
        some: {
          products: { some: { amountReceived: { gt: prisma.product.fields.amountDelivered } } },
        },
      },
    },
    select: { id: true, name: true, lastName: true, phoneNumber: true },
    orderBy: { name: 'asc' },
    take: 1000,
  });
  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id.toString(),
    label: `${c.name} ${c.lastName}`.trim(),
    phoneNumber: c.phoneNumber,
  }));

  const initialClientId =
    client && /^\d+$/.test(client) && clientOptions.some((c) => c.id === client)
      ? client
      : '';

  return (
    <NewDeliveryClient clientOptions={clientOptions} initialClientId={initialClientId} />
  );
}
