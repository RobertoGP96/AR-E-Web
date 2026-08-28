import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/action-helpers';
import { PrepareDeliveryClient } from './prepare-client';
import type { CategoryOption } from '../schema';
import type {
  PrepareClientGroup,
  PrepareProduct,
  PendingDeliverySummary,
} from './types';

/**
 * Mesa de trabajo del logístico: todo lo recibido y aún sin entregar,
 * agrupado por cliente, para armar las entregas de una pasada. Los
 * candidatos son los mismos que en /delivery/[id] (recibido > entregado)
 * pero de todos los clientes a la vez, con la procedencia (paquetes)
 * de cada producto para contrastar contra los bultos físicos.
 */
export default async function PrepareDeliveryPage() {
  const session = await auth();
  const role = session?.user?.role ?? '';
  const canWrite = (ROLES.delivery as readonly string[]).includes(role);

  const [products, categories, pendingDeliveries] = await Promise.all([
    prisma.product.findMany({
      where: { amountReceived: { gt: 0 } },
      select: {
        id: true,
        name: true,
        amountRequested: true,
        amountReceived: true,
        amountDelivered: true,
        order: {
          select: {
            id: true,
            clientId: true,
            client: {
              select: {
                name: true,
                lastName: true,
                phoneNumber: true,
                assignedAgent: { select: { agentProfit: true } },
              },
            },
          },
        },
        receiveds: {
          select: {
            amountReceived: true,
            package: {
              select: { id: true, agencyName: true, numberOfTracking: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    }),
    prisma.category.findMany({
      select: { id: true, name: true, clientShippingCharge: true },
      orderBy: { name: 'asc' },
    }),
    prisma.deliverReceip.findMany({
      where: { status: { in: ['Pendiente', 'En transito'] } },
      select: { id: true, clientId: true, status: true, deliverDate: true },
      orderBy: { deliverDate: 'desc' },
    }),
  ]);

  const pendingByClient = new Map<string, PendingDeliverySummary[]>();
  for (const dlv of pendingDeliveries) {
    const key = dlv.clientId.toString();
    const list = pendingByClient.get(key) ?? [];
    list.push({
      id: dlv.id.toString(),
      status: dlv.status,
      deliverDate: dlv.deliverDate.toISOString(),
    });
    pendingByClient.set(key, list);
  }

  const groupsByClient = new Map<string, PrepareClientGroup>();
  for (const p of products) {
    const ready = p.amountReceived - p.amountDelivered;
    if (ready <= 0) continue;

    // Procedencia: paquetes en los que se recibió el producto (únicos).
    const seenPackages = new Set<string>();
    const packages: PrepareProduct['packages'] = [];
    for (const r of p.receiveds) {
      if (!r.package) continue;
      const key = r.package.id.toString();
      if (seenPackages.has(key)) continue;
      seenPackages.add(key);
      packages.push({
        id: key,
        agency: r.package.agencyName,
        tracking: r.package.numberOfTracking,
      });
    }

    const clientId = p.order.clientId.toString();
    let group = groupsByClient.get(clientId);
    if (!group) {
      group = {
        clientId,
        clientName:
          `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        phoneNumber: p.order.client.phoneNumber,
        agentProfit: p.order.client.assignedAgent?.agentProfit ?? 0,
        products: [],
        totalReady: 0,
        pending: pendingByClient.get(clientId) ?? [],
      };
      groupsByClient.set(clientId, group);
    }
    group.products.push({
      id: p.id,
      name: p.name,
      orderId: p.order.id.toString(),
      requested: p.amountRequested,
      received: p.amountReceived,
      delivered: p.amountDelivered,
      ready,
      packages,
    });
    group.totalReady += ready;
  }

  const groups = [...groupsByClient.values()].sort(
    (a, b) =>
      b.totalReady - a.totalReady || a.clientName.localeCompare(b.clientName)
  );

  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id.toString(),
    label: c.name,
    clientShippingCharge: c.clientShippingCharge,
  }));

  return (
    <PrepareDeliveryClient
      groups={groups}
      categoryOptions={categoryOptions}
      canWrite={canWrite}
    />
  );
}
