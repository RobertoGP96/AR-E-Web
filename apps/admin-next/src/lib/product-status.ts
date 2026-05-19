import { prisma } from '@/lib/prisma';
import { deriveProductStatus } from '@/lib/order-cost';

/**
 * Faithful re-implementation of ProductStatusService.recalculate_
 * product_status() (api/services/product_status_service.py) +
 * _determine_product_status() (api/signals.py).
 *
 *   amount_purchased = Σ(ProductBuyed.amount_buyed − quantity_refuned)
 *   amount_received  = Σ ProductReceived.amount_received
 *   amount_delivered = Σ ProductDelivery.amount_delivered
 *
 * Django keeps these in sync via post_save/post_delete signals on the
 * ProductBuyed / ProductReceived / ProductDelivery models; this app
 * writes the DB directly so we must call this after any mutation of
 * those child rows.
 */
export async function recomputeProductAmounts(
  productId: string
): Promise<void> {
  const [buys, receps, delivers, product] = await Promise.all([
    prisma.productBuyed.aggregate({
      where: { originalProductId: productId },
      _sum: { amountBuyed: true, quantityRefuned: true },
    }),
    prisma.productReceived.aggregate({
      where: { originalProductId: productId },
      _sum: { amountReceived: true },
    }),
    prisma.productDelivery.aggregate({
      where: { originalProductId: productId },
      _sum: { amountDelivered: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { amountRequested: true },
    }),
  ]);

  if (!product) return;

  const amountPurchased =
    (buys._sum.amountBuyed ?? 0) - (buys._sum.quantityRefuned ?? 0);
  const amountReceived = receps._sum.amountReceived ?? 0;
  const amountDelivered = delivers._sum.amountDelivered ?? 0;

  const status = deriveProductStatus(
    product.amountRequested,
    amountPurchased,
    amountReceived,
    amountDelivered
  );

  await prisma.product.update({
    where: { id: productId },
    data: {
      amountPurchased: Math.max(0, amountPurchased),
      amountReceived,
      amountDelivered,
      status,
    },
  });
}
