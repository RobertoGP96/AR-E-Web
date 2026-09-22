import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  deriveOrderStatus,
  deriveProductStatus,
  type ProductStatus,
} from '@/lib/order-cost';

type Db = Prisma.TransactionClient;

/**
 * Re-implementación de ProductStatusService.recalculate_product_status()
 * (api/services/product_status_service.py) + _determine_product_status()
 * (api/signals.py), con la regla RN-011 (ADR-0005):
 *
 *   amount_purchased = Σ(ProductBuyed.amount_buyed − quantity_refuned)
 *   amount_received  = Σ ProductReceived.amount_received
 *   amount_delivered = Σ ProductDelivery.amount_delivered   (TODAS las entregas)
 *   estado           = derivado con las unidades en entregas «Entregado»
 *
 * `amountDelivered` cuenta todo lo asignado a bolsas/entregas para que
 * «recibido − entregado» no permita embolsar dos veces; el ESTADO solo
 * pasa a «Entregado» cuando la entrega se marcó como entregada.
 *
 * Django mantiene estos campos con signals; esta app escribe la BD
 * directamente, así que hay que llamar a esto tras cualquier mutación
 * de ProductBuyed / ProductReceived / ProductDelivery o del estado de
 * una DeliverReceip.
 */

export interface AmountInputs {
  requested: number;
  bought: number;
  refunded: number;
  received: number;
  deliveredAll: number;
  deliveredFinal: number;
}

export function deriveAmounts(i: AmountInputs): {
  amountPurchased: number;
  amountReceived: number;
  amountDelivered: number;
  status: ProductStatus;
} {
  const amountPurchased = Math.max(0, i.bought - i.refunded);
  return {
    amountPurchased,
    amountReceived: i.received,
    amountDelivered: i.deliveredAll,
    status: deriveProductStatus(
      i.requested,
      amountPurchased,
      i.received,
      i.deliveredFinal
    ),
  };
}

export async function recomputeProductAmounts(
  productId: string,
  tx?: Db
): Promise<void> {
  const run = async (db: Db) => {
    const [buys, receps, delivers, finals, product] = await Promise.all([
      db.productBuyed.aggregate({
        where: { originalProductId: productId },
        _sum: { amountBuyed: true, quantityRefuned: true },
      }),
      db.productReceived.aggregate({
        where: { originalProductId: productId },
        _sum: { amountReceived: true },
      }),
      db.productDelivery.aggregate({
        where: { originalProductId: productId },
        _sum: { amountDelivered: true },
      }),
      db.productDelivery.aggregate({
        where: {
          originalProductId: productId,
          deliverReceip: { status: 'Entregado' },
        },
        _sum: { amountDelivered: true },
      }),
      db.product.findUnique({
        where: { id: productId },
        select: { amountRequested: true, orderId: true },
      }),
    ]);

    if (!product) return;

    const next = deriveAmounts({
      requested: product.amountRequested,
      bought: buys._sum.amountBuyed ?? 0,
      refunded: buys._sum.quantityRefuned ?? 0,
      received: receps._sum.amountReceived ?? 0,
      deliveredAll: delivers._sum.amountDelivered ?? 0,
      deliveredFinal: finals._sum.amountDelivered ?? 0,
    });

    await db.product.update({ where: { id: productId }, data: next });
    await recomputeOrderStatus(product.orderId, db);
  };

  if (tx) {
    await run(tx);
  } else {
    await prisma.$transaction(run);
  }
}

/** RN-012: estado de la orden derivado del de sus productos (Cancelado se respeta). */
export async function recomputeOrderStatus(orderId: bigint, db: Db): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, products: { select: { status: true } } },
  });
  if (!order) return;
  const next = deriveOrderStatus(
    order.status,
    order.products.map((p) => p.status)
  );
  if (next !== order.status) {
    await db.order.update({ where: { id: orderId }, data: { status: next } });
  }
}

/** Recalcula todos los productos de una entrega (al cambiar su estado). */
export async function recomputeProductsOfDelivery(
  deliveryId: bigint,
  tx: Db
): Promise<number> {
  const rows = await tx.productDelivery.findMany({
    where: { deliverReceipId: deliveryId },
    select: { originalProductId: true },
    distinct: ['originalProductId'],
  });
  for (const r of rows) await recomputeProductAmounts(r.originalProductId, tx);
  return rows.length;
}

/** Unidades de cada producto que están en bolsas/entregas aún no entregadas. */
export async function loadInTransitUnits(
  productIds: string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.productDelivery.groupBy({
    by: ['originalProductId'],
    where: {
      originalProductId: { in: productIds },
      deliverReceip: { status: { not: 'Entregado' } },
    },
    _sum: { amountDelivered: true },
  });
  return new Map(rows.map((r) => [r.originalProductId, r._sum.amountDelivered ?? 0]));
}

/**
 * Recalcula el estado de TODOS los productos (mantenimiento tras un
 * despliegue o una limpieza). Lee los contadores y agrega en JS con la
 * misma regla que el recompute unitario; escribe por lotes.
 */
export async function recomputeAllProductStatuses(
  db: Db,
  batch = 500
): Promise<Record<ProductStatus, number>> {
  const [products, buys, receps, delivers, finals] = await Promise.all([
    db.product.findMany({ select: { id: true, amountRequested: true } }),
    db.productBuyed.groupBy({
      by: ['originalProductId'],
      _sum: { amountBuyed: true, quantityRefuned: true },
    }),
    db.productReceived.groupBy({
      by: ['originalProductId'],
      _sum: { amountReceived: true },
    }),
    db.productDelivery.groupBy({
      by: ['originalProductId'],
      _sum: { amountDelivered: true },
    }),
    db.productDelivery.groupBy({
      by: ['originalProductId'],
      where: { deliverReceip: { status: 'Entregado' } },
      _sum: { amountDelivered: true },
    }),
  ]);
  const b = new Map(buys.map((r) => [r.originalProductId, r._sum]));
  const rc = new Map(receps.map((r) => [r.originalProductId, r._sum.amountReceived ?? 0]));
  const dl = new Map(delivers.map((r) => [r.originalProductId, r._sum.amountDelivered ?? 0]));
  const fn = new Map(finals.map((r) => [r.originalProductId, r._sum.amountDelivered ?? 0]));

  const counts: Record<ProductStatus, number> = {
    Encargado: 0,
    Comprado: 0,
    Recibido: 0,
    Entregado: 0,
  };
  const updates: { id: string; data: ReturnType<typeof deriveAmounts> }[] = [];
  for (const p of products) {
    const sums = b.get(p.id);
    const data = deriveAmounts({
      requested: p.amountRequested,
      bought: sums?.amountBuyed ?? 0,
      refunded: sums?.quantityRefuned ?? 0,
      received: rc.get(p.id) ?? 0,
      deliveredAll: dl.get(p.id) ?? 0,
      deliveredFinal: fn.get(p.id) ?? 0,
    });
    counts[data.status] += 1;
    updates.push({ id: p.id, data });
  }
  for (let i = 0; i < updates.length; i += batch) {
    await Promise.all(
      updates
        .slice(i, i + batch)
        .map((u) => db.product.update({ where: { id: u.id }, data: u.data }))
    );
  }
  // RN-012: órdenes derivadas de los estados recién escritos.
  const orders = await db.order.findMany({
    where: { status: { not: 'Cancelado' } },
    select: { id: true, status: true, products: { select: { status: true } } },
  });
  const orderUpdates = orders
    .map((o) => ({ id: o.id, next: deriveOrderStatus(o.status, o.products.map((p) => p.status)) , cur: o.status }))
    .filter((o) => o.next !== o.cur);
  for (let i = 0; i < orderUpdates.length; i += batch) {
    await Promise.all(
      orderUpdates
        .slice(i, i + batch)
        .map((o) => db.order.update({ where: { id: o.id }, data: { status: o.next } }))
    );
  }
  return counts;
}
