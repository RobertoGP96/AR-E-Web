import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DeliveryDetailClient } from './delivery-detail-client';
import {
  fromDbDeliveryStatus,
  fromDbPayStatus,
  type DbDeliveryStatus,
  type DbPayStatus,
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
      client: { select: { id: true, name: true, lastName: true } },
      category: { select: { name: true } },
      deliveredProducts: {
        include: {
          originalProduct: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!delivery) notFound();

  // Candidate products: those in the client's orders that still have
  // received-but-not-delivered units.
  const candidateProducts = await prisma.product.findMany({
    where: {
      order: { clientId: delivery.clientId },
      amountReceived: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      amountReceived: true,
      amountDelivered: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <DeliveryDetailClient
      deliveryId={delivery.id.toString()}
      header={{
        clientName: `${delivery.client.name} ${delivery.client.lastName}`.trim(),
        categoryName: delivery.category?.name ?? null,
        weight: delivery.weight,
        status: fromDbDeliveryStatus(delivery.status as DbDeliveryStatus),
        paymentStatus: fromDbPayStatus(
          delivery.paymentStatus as DbPayStatus
        ),
        weightCost: delivery.weightCost,
        managerProfit: delivery.managerProfit,
      }}
      deliveredProducts={delivery.deliveredProducts.map((dp) => ({
        id: dp.id.toString(),
        productName: dp.originalProduct.name,
        amountDelivered: dp.amountDelivered,
      }))}
      candidates={candidateProducts
        .map((p) => ({
          id: p.id,
          name: p.name,
          remaining: p.amountReceived - p.amountDelivered,
        }))
        .filter((p) => p.remaining > 0)}
    />
  );
}
