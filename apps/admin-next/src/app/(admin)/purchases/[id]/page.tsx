import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { estimateBuyedCost } from '@/lib/order-cost';
import { PurchaseDetailClient } from './purchase-detail-client';
import { loadPendingCandidates, loadShopOptions } from '../queries';
import { fromDbPayStatus, type DbPayStatus, type PurchaseRow } from '../schema';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; order?: string }>;
}

export default async function PurchaseDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { created, order }] = await Promise.all([params, searchParams]);
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
        include: {
          originalProduct: {
            select: {
              name: true,
              orderId: true,
              amountRequested: true,
              amountReceived: true,
              shopCost: true,
              shopDeliveryCost: true,
              shopTaxes: true,
              chargeIva: true,
              addedTaxes: true,
              ownTaxes: true,
              totalCost: true,
              order: {
                select: { client: { select: { name: true, lastName: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!purchase) notFound();

  const [candidates, shopOptions] = await Promise.all([
    loadPendingCandidates(purchase.shopOfBuyId),
    loadShopOptions(),
  ]);

  const row: PurchaseRow = {
    id: purchase.id.toString(),
    shopOfBuyId: purchase.shopOfBuyId.toString(),
    shopName: purchase.shopOfBuy.name,
    shoppingAccountId: purchase.shoppingAccountId.toString(),
    accountName: purchase.shoppingAccount.accountName,
    statusOfShopping: fromDbPayStatus(purchase.statusOfShopping as DbPayStatus),
    cardId: purchase.cardId,
    buyDate: purchase.buyDate.toISOString(),
    totalCostOfPurchase: purchase.totalCostOfPurchase,
    productCount: purchase.buyedProducts.length,
  };

  return (
    <PurchaseDetailClient
      purchase={row}
      shopOptions={shopOptions}
      buyedProducts={purchase.buyedProducts.map((bp) => {
        const p = bp.originalProduct;
        return {
          id: bp.id.toString(),
          productName: p.name,
          orderId: p.orderId.toString(),
          clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
          amountBuyed: bp.amountBuyed,
          quantityRefuned: bp.quantityRefuned,
          isRefunded: bp.isRefunded,
          refundAmount: bp.refundAmount,
          refundNotes: bp.refundNotes,
          receivedOfProduct: p.amountReceived,
          estimate: estimateBuyedCost(
            { ...p, amountRequested: p.amountRequested },
            bp.amountBuyed
          ),
        };
      })}
      candidates={candidates}
      justCreated={created === '1'}
      fromOrderId={order && /^\d+$/.test(order) ? order : null}
    />
  );
}
