'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import { round2 } from '@/lib/order-cost';
import { balanceFormSchema, balanceRangeSchema } from './schema';
import type { BalanceRangeData } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

export type CalculateRangeResult =
  { ok: true; data: BalanceRangeData } | { ok: false; error: string };

function parseFormData(formData: FormData) {
  return balanceFormSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    systemWeight: formData.get('systemWeight'),
    registeredWeight: formData.get('registeredWeight'),
    revenues: formData.get('revenues'),
    buysCosts: formData.get('buysCosts'),
    costs: formData.get('costs'),
    expenses: formData.get('expenses'),
    notes: formData.get('notes') ?? '',
  });
}

/**
 * Re-implementation of the Vite admin balance generator
 * (apps/admin/src/components/balance/balance-report.tsx → handleSaveBalance),
 * which aggregated the Django report endpoints for the selected range:
 *
 *   systemWeight     = Σ DeliverReceip.weight            (deliverDate in range)
 *   registeredWeight = Σ Tag.weight                      (invoice.date in range)
 *   revenues         = Σ receivedValueOfClient of paid orders created in range
 *                    + Σ receivedValueOfClient of orders paid in range but
 *                      created outside it ("pagos fuera de fecha")
 *                    + Σ DeliverReceip.weightCost        (expected delivery revenue)
 *   buysCosts        = Σ ShoppingReceip.totalCostOfPurchase − refunds
 *                                                        (buyDate in range)
 *   costs            = Σ Invoice.total                   (invoice.date in range)
 *   expenses         = Σ Expense.amount                  (expense.date in range)
 *
 * The Vite report added payment_out_date.total_payments — an order COUNT —
 * to the revenue; here those orders contribute their revenue instead.
 * Dates are interpreted as UTC calendar days, matching how create/update
 * store startDate/endDate (new Date('YYYY-MM-DD')).
 */
export async function calculateBalanceRangeAction(
  startDate: string,
  endDate: string,
): Promise<CalculateRangeResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return { ok: false, error: denied.error };

  const parsed = balanceRangeSchema.safeParse({ startDate, endDate });
  if (!parsed.success) {
    return { ok: false, error: 'Rango de fechas inválido' };
  }

  const start = new Date(parsed.data.startDate);
  const endExclusive = new Date(
    Date.parse(parsed.data.endDate) + 24 * 60 * 60 * 1000,
  );
  const inRange = { gte: start, lt: endExclusive };

  const [
    paidOrders,
    outOfDateOrders,
    deliveries,
    purchases,
    refunds,
    invoices,
    invoiceTags,
    expenses,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: inRange, payStatus: 'Pagado' },
      _sum: { receivedValueOfClient: true },
      _count: { _all: true },
    }),
    // paymentDate defaults to createdAt on unpaid orders, so require an
    // actual received amount for a row to count as an out-of-range payment.
    prisma.order.aggregate({
      where: {
        paymentDate: inRange,
        NOT: { createdAt: inRange },
        receivedValueOfClient: { gt: 0 },
      },
      _sum: { receivedValueOfClient: true },
      _count: { _all: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { deliverDate: inRange },
      _sum: { weight: true, weightCost: true },
      _count: { _all: true },
    }),
    prisma.shoppingReceip.aggregate({
      where: { buyDate: inRange },
      _sum: { totalCostOfPurchase: true },
      _count: { _all: true },
    }),
    prisma.productBuyed.aggregate({
      where: { isRefunded: true, shopingReceip: { buyDate: inRange } },
      _sum: { refundAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { date: inRange },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.tag.aggregate({
      where: { invoice: { date: inRange } },
      _sum: { weight: true },
    }),
    prisma.expense.aggregate({
      where: { date: inRange },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const paidOrdersRevenue = round2(paidOrders._sum.receivedValueOfClient ?? 0);
  const outOfDateRevenue = round2(
    outOfDateOrders._sum.receivedValueOfClient ?? 0,
  );
  const deliveriesRevenue = round2(deliveries._sum.weightCost ?? 0);
  const purchasesGross = purchases._sum.totalCostOfPurchase ?? 0;
  const purchasesRefunded = round2(refunds._sum.refundAmount ?? 0);

  const data: BalanceRangeData = {
    systemWeight: round2(deliveries._sum.weight ?? 0),
    registeredWeight: round2(Number(invoiceTags._sum.weight ?? 0)),
    revenues: round2(paidOrdersRevenue + outOfDateRevenue + deliveriesRevenue),
    buysCosts: Math.max(0, round2(purchasesGross - purchasesRefunded)),
    costs: round2(Number(invoices._sum.total ?? 0)),
    expenses: round2(expenses._sum.amount ?? 0),
    breakdown: {
      paidOrdersRevenue,
      paidOrdersCount: paidOrders._count._all,
      outOfDateRevenue,
      outOfDateCount: outOfDateOrders._count._all,
      deliveriesRevenue,
      deliveriesCount: deliveries._count._all,
      purchasesCount: purchases._count._all,
      purchasesRefunded,
      invoicesCount: invoices._count._all,
      expensesCount: expenses._count._all,
    },
  };

  return { ok: true, data };
}

export async function createBalanceAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  await prisma.balance.create({
    data: {
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      systemWeight: parsed.data.systemWeight,
      registeredWeight: parsed.data.registeredWeight,
      revenues: parsed.data.revenues,
      buysCosts: parsed.data.buysCosts,
      costs: parsed.data.costs,
      expenses: parsed.data.expenses,
      notes: parsed.data.notes,
    },
  });

  revalidatePath('/balance');
  return { ok: true };
}

export async function updateBalanceAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const balanceId = parseId(formData.get('id'));
  if (!balanceId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.balance.update({
      where: { id: balanceId },
      data: {
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        systemWeight: parsed.data.systemWeight,
        registeredWeight: parsed.data.registeredWeight,
        revenues: parsed.data.revenues,
        buysCosts: parsed.data.buysCosts,
        costs: parsed.data.costs,
        expenses: parsed.data.expenses,
        notes: parsed.data.notes,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Balance not found' };
    }
    throw err;
  }

  revalidatePath('/balance');
  return { ok: true };
}

export async function deleteBalanceAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const balanceId = parseId(id);
  if (!balanceId) return { ok: false, error: 'Invalid balance id' };

  try {
    await prisma.balance.delete({ where: { id: balanceId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Balance not found' };
    }
    throw err;
  }

  revalidatePath('/balance');
  return { ok: true };
}
