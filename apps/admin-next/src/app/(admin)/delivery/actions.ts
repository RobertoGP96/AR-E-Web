'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computePayStatus, round2 } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  deliveryFormSchema,
  preparedDeliverySchema,
  toDbDeliveryStatus,
  toDbPayStatus,
  type PreparedDeliveryInput,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/**
 * weight_cost  = weight × Category.client_shipping_charge
 * manager_profit = weight × client.assignedAgent.agent_profit (0 if none)
 * Both are user-overridable in the Django/Vite UI but auto-derived from
 * these formulas; this app treats the formula as the source of truth.
 */
async function deriveCosts(
  clientId: bigint,
  categoryId: bigint | null,
  weight: number
): Promise<{ weightCost: number; managerProfit: number }> {
  const [category, client] = await Promise.all([
    categoryId
      ? prisma.category.findUnique({
          where: { id: categoryId },
          select: { clientShippingCharge: true },
        })
      : Promise.resolve(null),
    prisma.customUser.findUnique({
      where: { id: clientId },
      select: { assignedAgent: { select: { agentProfit: true } } },
    }),
  ]);
  const weightCost = round2(
    weight * (category?.clientShippingCharge ?? 0)
  );
  const managerProfit = round2(
    weight * (client?.assignedAgent?.agentProfit ?? 0)
  );
  return { weightCost, managerProfit };
}

function parse(formData: FormData) {
  return deliveryFormSchema.safeParse({
    clientId: formData.get('clientId'),
    categoryId: formData.get('categoryId') ?? '',
    weight: formData.get('weight'),
    status: formData.get('status'),
    deliverDate: formData.get('deliverDate'),
    deliverPicture: formData.get('deliverPicture') ?? '',
  });
}

export async function createDeliveryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const clientId = parseId(d.clientId);
  if (!clientId) return { ok: false, error: 'Invalid client id' };
  const categoryId = d.categoryId ? parseId(d.categoryId) : null;
  if (d.categoryId && !categoryId) {
    return { ok: false, error: 'Invalid category id' };
  }
  const { weightCost, managerProfit } = await deriveCosts(
    clientId,
    categoryId,
    d.weight
  );

  // Los pagos se registran después con confirmDeliveryPaymentAction.
  await prisma.deliverReceip.create({
    data: {
      clientId,
      categoryId,
      weight: d.weight,
      status: toDbDeliveryStatus(d.status),
      paymentStatus: toDbPayStatus(computePayStatus(weightCost, 0, 0)),
      paymentAmount: 0,
      balanceApplied: 0,
      paymentDate: null,
      deliverDate: new Date(d.deliverDate),
      deliverPicture: d.deliverPicture,
      weightCost,
      managerProfit,
    },
  });
  await recalculateClientBalance(clientId);

  revalidatePath('/delivery');
  return { ok: true };
}

/**
 * Flujo de /delivery/prepare: crea la entrega Y asocia los productos
 * seleccionados en una sola transacción. Equivale a createDeliveryAction
 * seguido de N × addDeliveredProductAction, pero atómico: si algún
 * producto ya no tiene unidades disponibles (otra entrega se le
 * adelantó) no se crea nada.
 */
export async function createPreparedDeliveryAction(
  input: PreparedDeliveryInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const parsed = preparedDeliverySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }
  const d = parsed.data;
  const clientId = parseId(d.clientId);
  if (!clientId) return { ok: false, error: 'Invalid client id' };
  const categoryId = d.categoryId ? parseId(d.categoryId) : null;
  if (d.categoryId && !categoryId) {
    return { ok: false, error: 'Invalid category id' };
  }
  const productIds = d.items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  const { weightCost, managerProfit } = await deriveCosts(
    clientId,
    categoryId,
    d.weight
  );

  const result = await prisma.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          amountReceived: true,
          amountDelivered: true,
          order: { select: { clientId: true } },
        },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const item of d.items) {
        const p = byId.get(item.productId);
        if (!p) return { ok: false as const, error: 'Producto no encontrado' };
        if (p.order.clientId !== clientId) {
          return {
            ok: false as const,
            error: `«${p.name}» no pertenece a este cliente`,
          };
        }
        const remaining = p.amountReceived - p.amountDelivered;
        if (item.amount > remaining) {
          return {
            ok: false as const,
            error: `Solo quedan ${remaining} unidad(es) de «${p.name}» por entregar`,
          };
        }
      }

      const delivery = await tx.deliverReceip.create({
        data: {
          clientId,
          categoryId,
          weight: d.weight,
          status: toDbDeliveryStatus('Pendiente'),
          paymentStatus: toDbPayStatus(computePayStatus(weightCost, 0, 0)),
          paymentAmount: 0,
          balanceApplied: 0,
          paymentDate: null,
          deliverDate: new Date(d.deliverDate),
          deliverPicture: null,
          weightCost,
          managerProfit,
        },
        select: { id: true },
      });
      await tx.productDelivery.createMany({
        data: d.items.map((i) => ({
          deliverReceipId: delivery.id,
          originalProductId: i.productId,
          amountDelivered: i.amount,
        })),
      });
      for (const item of d.items) {
        await recomputeProductAmounts(item.productId, tx);
      }
      await recalculateClientBalance(clientId, tx);
      return { ok: true as const, id: delivery.id.toString() };
    },
    // Una entrega grande recalcula muchos productos sobre el driver de
    // Neon; el timeout por defecto (5 s) se queda corto.
    { timeout: 60_000, maxWait: 10_000 }
  );

  if (!result.ok) return result;

  revalidatePath('/delivery');
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return { ok: true, id: result.id };
}

export async function updateDeliveryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const id = parseId(formData.get('id'));
  if (!id) return { ok: false, error: 'Missing or invalid id' };

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const existing = await prisma.deliverReceip.findUnique({
    where: { id },
    select: {
      clientId: true,
      paymentAmount: true,
      balanceApplied: true,
    },
  });
  if (!existing) return { ok: false, error: 'Delivery not found' };

  const clientId = parseId(d.clientId);
  if (!clientId) return { ok: false, error: 'Invalid client id' };
  const categoryId = d.categoryId ? parseId(d.categoryId) : null;
  if (d.categoryId && !categoryId) {
    return { ok: false, error: 'Invalid category id' };
  }
  const { weightCost, managerProfit } = await deriveCosts(
    clientId,
    categoryId,
    d.weight
  );
  // Los montos pagados no se editan aquí (confirmDeliveryPaymentAction
  // los acumula), pero el costo por peso puede cambiar con el peso o la
  // categoría, así que el estado de pago se recalcula contra el nuevo
  // total con los pagos ya registrados.
  const payStatus = computePayStatus(
    weightCost,
    existing.paymentAmount,
    existing.balanceApplied
  );

  await prisma.deliverReceip.update({
    where: { id },
    data: {
      clientId,
      categoryId,
      weight: d.weight,
      status: toDbDeliveryStatus(d.status),
      paymentStatus: toDbPayStatus(payStatus),
      deliverDate: new Date(d.deliverDate),
      deliverPicture: d.deliverPicture,
      weightCost,
      managerProfit,
    },
  });

  await recalculateClientBalance(existing.clientId);
  if (existing.clientId !== clientId) {
    await recalculateClientBalance(clientId);
  }

  revalidatePath('/delivery');
  return { ok: true };
}

/**
 * Registro de pago de una entrega — mirrors DeliverReceip.add_payment()
 * in api/models/deliveries.py: payment_amount and balance_applied
 * ACCUMULATE, payment_status is recomputed against weight_cost (or
 * forced to Pagado), payment_date is stamped. Transactional with the
 * client-balance recalculation.
 */
export async function confirmDeliveryPaymentAction(
  id: string,
  amount: number,
  applyBalance: number,
  markPaidManually: boolean
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const deliveryId = parseId(id);
  if (!deliveryId) return { ok: false, error: 'Invalid delivery id' };
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'El monto no puede ser negativo' };
  }
  if (!Number.isFinite(applyBalance) || applyBalance < 0) {
    return { ok: false, error: 'El saldo aplicado no puede ser negativo' };
  }
  if (amount === 0 && applyBalance === 0 && !markPaidManually) {
    return { ok: false, error: 'Ingresa un monto o aplica saldo' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: deliveryId },
      select: {
        weightCost: true,
        paymentAmount: true,
        balanceApplied: true,
        paymentDate: true,
        clientId: true,
        client: { select: { balance: true } },
      },
    });
    if (!delivery) return { ok: false as const, error: 'Delivery not found' };

    const available = Math.max(0, delivery.client.balance);
    if (applyBalance > available) {
      return {
        ok: false as const,
        error: `El cliente solo tiene ${round2(available).toFixed(2)} de saldo a favor`,
      };
    }

    const newPayment = round2(delivery.paymentAmount + amount);
    const newApplied = round2(delivery.balanceApplied + applyBalance);
    const payStatus = markPaidManually
      ? 'Pagado'
      : computePayStatus(delivery.weightCost, newPayment, newApplied);

    await tx.deliverReceip.update({
      where: { id: deliveryId },
      data: {
        paymentAmount: newPayment,
        balanceApplied: newApplied,
        paymentStatus: toDbPayStatus(payStatus),
        paymentDate: new Date(),
      },
    });
    await recalculateClientBalance(delivery.clientId, tx);
    return { ok: true as const };
  });

  if (!result.ok) return result;

  revalidatePath('/delivery');
  revalidatePath(`/delivery/${id}`);
  return { ok: true };
}

export async function deleteDeliveryAction(
  id: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const did = parseId(id);
  if (!did) return { ok: false, error: 'Invalid delivery id' };
  const existing = await prisma.deliverReceip.findUnique({
    where: { id: did },
    select: { clientId: true },
  });
  if (!existing) return { ok: false, error: 'Delivery not found' };

  try {
    await prisma.deliverReceip.delete({ where: { id: did } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      return {
        ok: false,
        error: 'Cannot delete: delivery has linked delivered products',
      };
    }
    throw err;
  }
  await recalculateClientBalance(existing.clientId);

  revalidatePath('/delivery');
  return { ok: true };
}

export async function addDeliveredProductAction(
  deliveryId: string,
  productId: string,
  amount: number
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const did = parseId(deliveryId);
  if (!did) return { ok: false, error: 'Invalid delivery id' };
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'Amount must be a positive integer' };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { amountReceived: true, amountDelivered: true, name: true },
  });
  if (!product) return { ok: false, error: 'Product not found' };

  const remaining = product.amountReceived - product.amountDelivered;
  if (amount > remaining) {
    return {
      ok: false,
      error: `Only ${remaining} unit(s) of "${product.name}" are received but not yet delivered`,
    };
  }

  await prisma.productDelivery.create({
    data: {
      deliverReceipId: did,
      originalProductId: productId,
      amountDelivered: amount,
    },
  });
  await recomputeProductAmounts(productId);

  revalidatePath(`/delivery/${deliveryId}`);
  revalidatePath('/orders');
  return { ok: true };
}

export async function removeDeliveredProductAction(
  deliveryId: string,
  productDeliveryId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const rowId = parseId(productDeliveryId);
  if (!rowId) return { ok: false, error: 'Invalid row id' };

  const row = await prisma.productDelivery.findUnique({
    where: { id: rowId },
    select: { originalProductId: true },
  });
  if (!row) return { ok: false, error: 'Delivered product not found' };

  await prisma.productDelivery.delete({ where: { id: rowId } });
  await recomputeProductAmounts(row.originalProductId);

  revalidatePath(`/delivery/${deliveryId}`);
  revalidatePath('/orders');
  return { ok: true };
}
