import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { round2 } from '@/lib/order-cost';

type Db = Prisma.TransactionClient;

/**
 * Faithful re-implementation of CustomUser.recalculate_balance()
 * (api/models/users.py). Django keeps this in sync via post_save /
 * post_delete signals on Order and DeliverReceip; this app writes the
 * DB directly so every order/delivery mutation must call this.
 *
 *   balance = (Σ order.received_value_of_client + Σ delivery.payment_amount)
 *           - (Σ order.total_costs            + Σ delivery.weight_cost)
 *
 * Note: balance_applied is intentionally NOT part of this sum — only
 * cash actually received counts, matching the Django aggregate.
 *
 * Pass `tx` to run inside an existing transaction; without it the
 * aggregate + update pair runs in its own transaction so a concurrent
 * mutation cannot interleave between the read and the write.
 */
export async function recalculateClientBalance(
  clientId: bigint,
  tx?: Db
): Promise<void> {
  const run = async (db: Db) => {
    const [orderAgg, deliveryAgg] = await Promise.all([
      db.order.aggregate({
        where: { clientId },
        _sum: { receivedValueOfClient: true, totalCosts: true },
      }),
      db.deliverReceip.aggregate({
        where: { clientId },
        _sum: { paymentAmount: true, weightCost: true },
      }),
    ]);

    const received =
      (orderAgg._sum.receivedValueOfClient ?? 0) +
      (deliveryAgg._sum.paymentAmount ?? 0);
    const cost =
      (orderAgg._sum.totalCosts ?? 0) + (deliveryAgg._sum.weightCost ?? 0);

    await db.customUser.update({
      where: { id: clientId },
      data: { balance: round2(received - cost) },
    });
  };

  if (tx) {
    await run(tx);
  } else {
    await prisma.$transaction(run);
  }
}
