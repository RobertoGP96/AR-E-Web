import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrderDetailClient } from './order-detail-client';
import {
  fromDbPayStatus,
  type DbPayStatus,
  type ProductRow,
  type SelectOption,
} from '../schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  let orderId: bigint;
  try {
    orderId = BigInt(id);
  } catch {
    notFound();
  }

  const [order, shops, categories] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { name: true, lastName: true, phoneNumber: true } },
        salesManager: { select: { name: true, lastName: true } },
        products: {
          include: {
            shop: { select: { name: true } },
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
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

  if (!order) notFound();

  const products: ProductRow[] = order.products.map((p) => ({
    id: p.id,
    name: p.name,
    shopId: p.shopId.toString(),
    shopName: p.shop.name,
    categoryId: p.categoryId ? p.categoryId.toString() : null,
    categoryName: p.category?.name ?? null,
    link: p.link,
    sku: p.sku,
    description: p.description,
    amountRequested: p.amountRequested,
    amountPurchased: p.amountPurchased,
    amountReceived: p.amountReceived,
    amountDelivered: p.amountDelivered,
    status: p.status,
    shopCost: p.shopCost,
    shopDeliveryCost: p.shopDeliveryCost,
    shopTaxes: p.shopTaxes,
    chargeIva: p.chargeIva,
    baseTax: p.baseTax,
    shopTaxAmount: p.shopTaxAmount,
    ownTaxes: p.ownTaxes,
    addedTaxes: p.addedTaxes,
    totalCost: p.totalCost,
  }));

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
    <OrderDetailClient
      orderId={order.id.toString()}
      header={{
        clientName: `${order.client.name} ${order.client.lastName}`.trim(),
        clientPhone: order.client.phoneNumber,
        salesManagerName: order.salesManager
          ? `${order.salesManager.name} ${order.salesManager.lastName}`.trim()
          : null,
        status: order.status,
        payStatus: fromDbPayStatus(order.payStatus as DbPayStatus),
        totalCosts: order.totalCosts,
        receivedValueOfClient: order.receivedValueOfClient,
        balanceApplied: order.balanceApplied,
        observations: order.observations,
      }}
      products={products}
      shopOptions={shopOptions}
      categoryOptions={categoryOptions}
    />
  );
}
