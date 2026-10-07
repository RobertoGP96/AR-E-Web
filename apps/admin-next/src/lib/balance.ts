import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { computeClientBalance, type BalanceItem, type ClientBalance } from '@/lib/client-balance';

type Db = Prisma.TransactionClient;

/**
 * Partidas del cliente tal como las lee RN-021 (2.0.0): todas sus órdenes
 * y entregas, sin filtrar por estado. Las bolsas (costo 0) no afectan.
 */
export async function loadBalanceItems(clientId: bigint, db: Db): Promise<BalanceItem[]> {
  const [orders, deliveries] = await Promise.all([
    db.order.findMany({
      where: { clientId },
      select: { totalCosts: true, receivedValueOfClient: true, balanceApplied: true },
    }),
    db.deliverReceip.findMany({
      where: { clientId },
      select: { weightCost: true, paymentAmount: true, balanceApplied: true },
    }),
  ]);
  return [
    ...orders.map((o) => ({
      kind: 'order' as const,
      cost: o.totalCosts,
      cash: o.receivedValueOfClient,
      applied: o.balanceApplied,
    })),
    ...deliveries.map((d) => ({
      kind: 'delivery' as const,
      cost: d.weightCost,
      cash: d.paymentAmount,
      applied: d.balanceApplied,
    })),
  ];
}

/**
 * Re-implementación fiel de CustomUser.recalculate_balance() (RN-021
 * 2.0.0, ADR-0009): guarda en `CustomUser.balance` el **saldo a favor**
 * (≥ 0) y en `CustomUser.debt` la **deuda pendiente**, calculados por
 * `computeClientBalance` (función pura compartida con Django). Django lo
 * dispara con señales; esta app escribe la BD directamente, así que toda
 * mutación de orden o entrega debe llamar a esta función.
 *
 * Pass `tx` to run inside an existing transaction; without it the
 * read + update pair runs in its own transaction so a concurrent
 * mutation cannot interleave between the read and the write.
 */
export async function recalculateClientBalance(
  clientId: bigint,
  tx?: Db
): Promise<ClientBalance> {
  const run = async (db: Db): Promise<ClientBalance> => {
    const result = computeClientBalance(await loadBalanceItems(clientId, db));
    await db.customUser.update({
      where: { id: clientId },
      data: { balance: result.balance, debt: result.debt },
    });
    return result;
  };

  return tx ? run(tx) : prisma.$transaction(run);
}
