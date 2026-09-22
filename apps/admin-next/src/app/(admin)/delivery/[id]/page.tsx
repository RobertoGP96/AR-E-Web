import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseId } from '@/lib/action-helpers';
import { deliveryPhase } from '@/lib/delivery-status';
import { DeliveryDetailClient } from './delivery-detail-client';
import {
  fromDbDeliveryStatus,
  fromDbPayStatus,
  type DbDeliveryStatus,
  type DbPayStatus,
  type ReceivedCandidate,
} from '../schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeliveryDetailPage({ params }: PageProps) {
  const { id } = await params;
  let deliveryId: bigint;
  try {
    deliveryId = BigInt(id);
  } catch {
    notFound();
  }

  const delivery = await prisma.deliverReceip.findUnique({
    where: { id: deliveryId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          lastName: true,
          balance: true,
          assignedAgentId: true,
          assignedAgent: { select: { agentProfit: true } },
        },
      },
      category: { select: { name: true, clientShippingCharge: true } },
      deliveredProducts: {
        include: {
          originalProduct: {
            select: { name: true, orderId: true, category: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!delivery) notFound();

  // Un agente solo ve las entregas de sus clientes asignados.
  const session = await auth();
  const role = session?.user?.role ?? '';
  if (role === 'agent') {
    const agentId = parseId(session?.user?.id ?? '');
    if (agentId === null || delivery.client.assignedAgentId !== agentId) {
      notFound();
    }
  }

  // Candidatos: recibidos sin entregar del mismo cliente (y de la misma
  // categoría si la entrega la tiene).
  const candidateProducts = await prisma.product.findMany({
    where: {
      order: { clientId: delivery.clientId },
      amountReceived: { gt: 0 },
      ...(delivery.categoryId !== null && { categoryId: delivery.categoryId }),
    },
    select: {
      id: true,
      name: true,
      orderId: true,
      amountReceived: true,
      amountDelivered: true,
      categoryId: true,
      category: { select: { name: true, clientShippingCharge: true } },
    },
    orderBy: { name: 'asc' },
    take: 500,
  });
  const candidates: ReceivedCandidate[] = candidateProducts
    .map((p) => ({
      id: p.id,
      name: p.name,
      orderId: p.orderId.toString(),
      categoryId: p.categoryId ? p.categoryId.toString() : null,
      categoryName: p.category?.name ?? null,
      chargePerLb: p.category?.clientShippingCharge ?? 0,
      available: p.amountReceived - p.amountDelivered,
    }))
    .filter((p) => p.available > 0);

  return (
    <DeliveryDetailClient
      role={role}
      delivery={{
        id: delivery.id.toString(),
        clientId: delivery.clientId.toString(),
        clientName: `${delivery.client.name} ${delivery.client.lastName}`.trim(),
        clientBalance: delivery.client.balance,
        categoryId: delivery.categoryId ? delivery.categoryId.toString() : null,
        categoryName: delivery.category?.name ?? null,
        weight: delivery.weight,
        status: fromDbDeliveryStatus(delivery.status as DbDeliveryStatus),
        phase: deliveryPhase({ status: delivery.status, weight: delivery.weight }),
        paymentStatus: fromDbPayStatus(delivery.paymentStatus as DbPayStatus),
        weightCost: delivery.weightCost,
        managerProfit: delivery.managerProfit,
        paymentAmount: delivery.paymentAmount,
        balanceApplied: delivery.balanceApplied,
        deliverDate: delivery.deliverDate.toISOString(),
        deliverPicture: delivery.deliverPicture,
        productCount: delivery.deliveredProducts.length,
        chargePerLb: delivery.category?.clientShippingCharge ?? 0,
        agentProfit: delivery.client.assignedAgent?.agentProfit ?? 0,
      }}
      deliveredProducts={delivery.deliveredProducts.map((dp) => ({
        id: dp.id.toString(),
        productName: dp.originalProduct.name,
        orderId: dp.originalProduct.orderId.toString(),
        amountDelivered: dp.amountDelivered,
      }))}
      candidates={candidates}
    />
  );
}
