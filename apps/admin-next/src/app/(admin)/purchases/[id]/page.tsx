import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PurchaseDetailClient } from './purchase-detail-client';
import { fromDbPayStatus, type DbPayStatus } from '../schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  let purchaseId: bigint;
  try {
    purchaseId = BigInt(id);
  } catch {
    notFound();
  }

  const purchase = await prisma.shoppingReceip.findUnique({
    where: { id: purchaseId },
    include: {
      shopOfBuy: { select: { id: true, name: true } },
      shoppingAccount: { select: { accountName: true } },
      buyedProducts: {
        include: { originalProduct: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!purchase) notFound();

  // Candidate products to add: products sold from the same shop.
  const candidateProducts = await prisma.product.findMany({
    where: { shopId: purchase.shopOfBuyId },
    select: {
      id: true,
      name: true,
      amountRequested: true,
      amountPurchased: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <PurchaseDetailClient
      purchaseId={purchase.id.toString()}
      header={{
        shopName: purchase.shopOfBuy.name,
        accountName: purchase.shoppingAccount.accountName,
        status: fromDbPayStatus(purchase.statusOfShopping as DbPayStatus),
        totalCostOfPurchase: purchase.totalCostOfPurchase,
      }}
      buyedProducts={purchase.buyedProducts.map((bp) => ({
        id: bp.id.toString(),
        productName: bp.originalProduct.name,
        amountBuyed: bp.amountBuyed,
        quantityRefuned: bp.quantityRefuned,
        isRefunded: bp.isRefunded,
        refundAmount: bp.refundAmount,
      }))}
      candidates={candidateProducts.map((p) => ({
        id: p.id,
        name: p.name,
        pending: Math.max(0, p.amountRequested - p.amountPurchased),
      }))}
    />
  );
}
