/**
 * RN-023 — Redistribución de sobrepago sobre la base de datos (servidor).
 * La regla pura vive en `./surplus`; aquí se cargan los pendientes del
 * cliente y se mueve el efectivo dentro de la transacción que recibe.
 *
 * Invariante: Σ efectivo del cliente no cambia, así que su balance
 * (RN-021) tampoco; solo cambian los estados de pago (RN-020) de las
 * partidas implicadas.
 */
import type { Prisma } from '@prisma/client';
import { computePayStatus, round2 } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import {
  movableSurplus,
  planSurplusDistribution,
  sortSurplusTargets,
  type PendingTarget,
  type SurplusAllocation,
  type SurplusTargetKind,
} from '@/lib/surplus';

export type { PendingTarget } from '@/lib/surplus';

type Db = Prisma.TransactionClient;

export interface SurplusSource {
  kind: SurplusTargetKind;
  id: bigint;
}

export interface RedistributionResult {
  /** Efectivo movido desde el origen. */
  moved: number;
  allocations: SurplusAllocation[];
  /** Exceso que sigue en el origen como saldo a favor. */
  remaining: number;
}

/**
 * Órdenes (no canceladas, con costo) y entregas pesadas del cliente con
 * pendiente > 0, en el orden canónico de RN-023. `exclude` deja fuera la
 * partida origen del sobrepago.
 */
export async function loadPendingTargets(
  db: Db,
  clientId: bigint,
  exclude?: SurplusSource
): Promise<PendingTarget[]> {
  const [orders, deliveries] = await Promise.all([
    db.order.findMany({
      where: {
        clientId,
        status: { not: 'Cancelado' },
        totalCosts: { gt: 0 },
        ...(exclude?.kind === 'order' && { id: { not: exclude.id } }),
      },
      select: {
        id: true,
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
        createdAt: true,
      },
    }),
    db.deliverReceip.findMany({
      where: {
        clientId,
        weight: { gt: 0 },
        ...(exclude?.kind === 'delivery' && { id: { not: exclude.id } }),
      },
      select: {
        id: true,
        weightCost: true,
        paymentAmount: true,
        balanceApplied: true,
        deliverDate: true,
      },
    }),
  ]);

  const targets: PendingTarget[] = [];
  for (const o of orders) {
    const pending = round2(o.totalCosts - o.receivedValueOfClient - o.balanceApplied);
    if (pending <= 0) continue;
    targets.push({
      kind: 'order',
      id: o.id.toString(),
      label: `Pedido #${o.id.toString()}`,
      cost: o.totalCosts,
      pending,
      date: o.createdAt.toISOString(),
    });
  }
  for (const d of deliveries) {
    const pending = round2(d.weightCost - d.paymentAmount - d.balanceApplied);
    if (pending <= 0) continue;
    targets.push({
      kind: 'delivery',
      id: d.id.toString(),
      label: `Entrega #${d.id.toString()}`,
      cost: d.weightCost,
      pending,
      date: d.deliverDate.toISOString(),
    });
  }
  return sortSurplusTargets(targets);
}

async function loadSource(db: Db, source: SurplusSource) {
  if (source.kind === 'order') {
    const o = await db.order.findUnique({
      where: { id: source.id },
      select: {
        clientId: true,
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
        paymentDate: true,
      },
    });
    if (!o) return null;
    return {
      clientId: o.clientId,
      cost: o.totalCosts,
      cash: o.receivedValueOfClient,
      balanceApplied: o.balanceApplied,
      paymentDate: o.paymentDate,
    };
  }
  const d = await db.deliverReceip.findUnique({
    where: { id: source.id },
    select: {
      clientId: true,
      weightCost: true,
      paymentAmount: true,
      balanceApplied: true,
      paymentDate: true,
    },
  });
  if (!d) return null;
  return {
    clientId: d.clientId,
    cost: d.weightCost,
    cash: d.paymentAmount,
    balanceApplied: d.balanceApplied,
    paymentDate: d.paymentDate,
  };
}

/**
 * Mueve el exceso de efectivo del origen a los pendientes del cliente
 * (RN-023). Debe ejecutarse dentro de la transacción del cobro o de la
 * acción explícita de reparto. Devuelve `moved = 0` si no hay sobrepago
 * ni pendientes.
 */
export async function redistributeSurplusInTx(
  tx: Db,
  source: SurplusSource
): Promise<RedistributionResult | { error: string }> {
  const src = await loadSource(tx, source);
  if (!src) return { error: 'Partida no encontrada' };

  const surplus = movableSurplus(src.cost, src.cash, src.balanceApplied);
  if (surplus <= 0) return { moved: 0, allocations: [], remaining: 0 };

  const targets = await loadPendingTargets(tx, src.clientId, source);
  const plan = planSurplusDistribution(surplus, targets);
  if (plan.allocations.length === 0) {
    return { moved: 0, allocations: [], remaining: plan.remaining };
  }

  const paymentDate = src.paymentDate ?? new Date();
  for (const a of plan.allocations) {
    const id = BigInt(a.id);
    if (a.kind === 'order') {
      const o = await tx.order.findUniqueOrThrow({
        where: { id },
        select: { totalCosts: true, receivedValueOfClient: true, balanceApplied: true },
      });
      const cash = round2(o.receivedValueOfClient + a.amount);
      await tx.order.update({
        where: { id },
        data: {
          receivedValueOfClient: cash,
          payStatus: computePayStatus(o.totalCosts, cash, o.balanceApplied),
          paymentDate,
        },
      });
    } else {
      const d = await tx.deliverReceip.findUniqueOrThrow({
        where: { id },
        select: { weightCost: true, paymentAmount: true, balanceApplied: true },
      });
      const cash = round2(d.paymentAmount + a.amount);
      await tx.deliverReceip.update({
        where: { id },
        data: {
          paymentAmount: cash,
          paymentStatus: computePayStatus(d.weightCost, cash, d.balanceApplied),
          paymentDate,
        },
      });
    }
  }

  const moved = round2(surplus - plan.remaining);
  const newCash = round2(src.cash - moved);
  const newStatus = computePayStatus(src.cost, newCash, src.balanceApplied);
  if (source.kind === 'order') {
    await tx.order.update({
      where: { id: source.id },
      data: { receivedValueOfClient: newCash, payStatus: newStatus },
    });
  } else {
    await tx.deliverReceip.update({
      where: { id: source.id },
      data: { paymentAmount: newCash, paymentStatus: newStatus },
    });
  }

  // El balance no cambia (misma suma de efectivo), pero se recalcula para
  // mantener la columna cacheada coherente tras cualquier redondeo.
  await recalculateClientBalance(src.clientId, tx);

  return { moved, allocations: plan.allocations, remaining: plan.remaining };
}
