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
  toDbDeliveryStatus,
  toDbPayStatus,
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
    paymentAmount: formData.get('paymentAmount') ?? 0,
    balanceApplied: formData.get('balanceApplied') ?? 0,
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
  const payStatus = computePayStatus(
    weightCost,
    d.paymentAmount,
    d.balanceApplied
  );

  await prisma.deliverReceip.create({
    data: {
      clientId,
      categoryId,
      weight: d.weight,
      status: toDbDeliveryStatus(d.status),
      paymentStatus: toDbPayStatus(payStatus),
      paymentAmount: d.paymentAmount,
      balanceApplied: d.balanceApplied,
      paymentDate: d.paymentAmount > 0 ? new Date() : null,
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
    select: { clientId: true, paymentDate: true },
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
  const payStatus = computePayStatus(
    weightCost,
    d.paymentAmount,
    d.balanceApplied
  );

  await prisma.deliverReceip.update({
    where: { id },
    data: {
      clientId,
      categoryId,
      weight: d.weight,
      status: toDbDeliveryStatus(d.status),
      paymentStatus: toDbPayStatus(payStatus),
      paymentAmount: d.paymentAmount,
      balanceApplied: d.balanceApplied,
      // Preserve the original payment date on edits; only stamp a new
      // one when payment goes from 0 to > 0, and clear it back to null
      // when payment is removed.
      paymentDate:
        d.paymentAmount > 0 ? (existing.paymentDate ?? new Date()) : null,
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
