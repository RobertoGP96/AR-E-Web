import 'server-only';

import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import type { StatementDelivery, StatementOrder } from '@/lib/client-statement';

export interface StatementClient {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  homeAddress: string;
  agentName: string | null;
  /** Columna cacheada `CustomUser.balance`; el documento recalcula en vivo (RN-021). */
  storedBalance: number;
}

export interface ClientStatementData {
  client: StatementClient;
  orders: StatementOrder[];
  deliveries: StatementDelivery[];
}

/**
 * Carga todo lo que necesitan los documentos al cliente: sus órdenes con
 * productos y sus entregas. Sin filtrar por estado, igual que RN-021.
 */
export async function loadClientStatementData(
  clientId: bigint
): Promise<ClientStatementData | null> {
  const [client, orders, deliveries] = await Promise.all([
    prisma.customUser.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        homeAddress: true,
        balance: true,
        assignedAgent: { select: { name: true, lastName: true } },
      },
    }),
    prisma.order.findMany({
      where: { clientId },
      select: {
        id: true,
        createdAt: true,
        paymentDate: true,
        status: true,
        payStatus: true,
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
        products: {
          select: {
            id: true,
            name: true,
            amountRequested: true,
            shopCost: true,
            totalCost: true,
            shop: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.deliverReceip.findMany({
      where: { clientId },
      select: {
        id: true,
        deliverDate: true,
        paymentDate: true,
        status: true,
        paymentStatus: true,
        weight: true,
        weightCost: true,
        paymentAmount: true,
        balanceApplied: true,
        category: { select: { name: true } },
        _count: { select: { deliveredProducts: true } },
      },
      orderBy: { deliverDate: 'asc' },
    }),
  ]);

  if (!client) return null;

  return {
    client: {
      id: client.id.toString(),
      name: `${client.name} ${client.lastName}`.trim(),
      phoneNumber: client.phoneNumber,
      email: client.email,
      homeAddress: client.homeAddress,
      agentName: client.assignedAgent
        ? `${client.assignedAgent.name} ${client.assignedAgent.lastName}`.trim()
        : null,
      storedBalance: round2(client.balance),
    },
    orders: orders.map((o) => ({
      id: o.id.toString(),
      createdAt: o.createdAt.toISOString(),
      paymentDate: o.paymentDate.toISOString(),
      status: o.status,
      payStatus: o.payStatus,
      totalCosts: round2(o.totalCosts),
      received: round2(o.receivedValueOfClient),
      balanceApplied: round2(o.balanceApplied),
      products: o.products.map((p) => ({
        id: p.id,
        name: p.name,
        shopName: p.shop.name,
        amountRequested: p.amountRequested,
        shopCost: round2(p.shopCost),
        totalCost: round2(p.totalCost),
      })),
    })),
    deliveries: deliveries.map((d) => ({
      id: d.id.toString(),
      deliverDate: d.deliverDate.toISOString(),
      paymentDate: d.paymentDate ? d.paymentDate.toISOString() : null,
      status: d.status,
      paymentStatus: d.paymentStatus,
      weight: round2(d.weight),
      weightCost: round2(d.weightCost),
      received: round2(d.paymentAmount),
      balanceApplied: round2(d.balanceApplied),
      categoryName: d.category?.name ?? null,
      productCount: d._count.deliveredProducts,
    })),
  };
}
