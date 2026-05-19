'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { computePayStatus, round2 } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  deliveryFormSchema,
  toDbDeliveryStatus,
  toDbPayStatus,
} from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireStaff(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  const allowed = new Set(['admin', 'agent', 'accountant', 'logistical']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function zErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

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
  const denied = await requireStaff();
  if (denied) return denied;

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const clientId = BigInt(d.clientId);
  const categoryId = d.categoryId ? BigInt(d.categoryId) : null;
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
  const denied = await requireStaff();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const id = BigInt(idRaw);

  const existing = await prisma.deliverReceip.findUnique({
    where: { id },
    select: { clientId: true },
  });
  if (!existing) return { ok: false, error: 'Delivery not found' };

  const clientId = BigInt(d.clientId);
  const categoryId = d.categoryId ? BigInt(d.categoryId) : null;
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
      paymentDate: d.paymentAmount > 0 ? new Date() : null,
      deliverDate: new Date(d.deliverDate),
      deliverPicture: d.deliverPicture,
      weightCost,
      managerProfit,
    },
  });

  await recalculateClientBalance(existing.clientId);
  if (existing.clientId.toString() !== d.clientId) {
    await recalculateClientBalance(clientId);
  }

  revalidatePath('/delivery');
  return { ok: true };
}

export async function deleteDeliveryAction(
  id: string
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  const did = BigInt(id);
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
  const denied = await requireStaff();
  if (denied) return denied;

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
      deliverReceipId: BigInt(deliveryId),
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
  const denied = await requireStaff();
  if (denied) return denied;

  const row = await prisma.productDelivery.findUnique({
    where: { id: BigInt(productDeliveryId) },
    select: { originalProductId: true },
  });
  if (!row) return { ok: false, error: 'Delivered product not found' };

  await prisma.productDelivery.delete({
    where: { id: BigInt(productDeliveryId) },
  });
  await recomputeProductAmounts(row.originalProductId);

  revalidatePath(`/delivery/${deliveryId}`);
  revalidatePath('/orders');
  return { ok: true };
}
