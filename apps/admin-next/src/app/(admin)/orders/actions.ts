'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  computeProductCost,
  computePayStatus,
  deriveProductStatus,
  round2,
} from '@/lib/order-cost';
import {
  orderFormSchema,
  productFormSchema,
  toDbPayStatus,
} from './schema';

export type ActionResult =
  | { ok: true; id?: string }
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
 * Mirrors Order.update_total_costs() + the pay_status branch in
 * api/models/orders.py. Always run inside (or right after) a product
 * mutation so the cached total stays correct.
 */
async function refreshOrderTotals(orderId: bigint): Promise<void> {
  const products = await prisma.product.findMany({
    where: { orderId },
    select: { totalCost: true },
  });
  const totalCosts = round2(
    products.reduce((sum, p) => sum + p.totalCost, 0)
  );
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { receivedValueOfClient: true, balanceApplied: true, clientId: true },
  });
  if (!order) return;
  const payStatus = computePayStatus(
    totalCosts,
    order.receivedValueOfClient,
    order.balanceApplied
  );
  await prisma.order.update({
    where: { id: orderId },
    data: { totalCosts, payStatus: toDbPayStatus(payStatus) },
  });
  await recalculateClientBalance(order.clientId);
}

/**
 * Mirrors CustomUser.recalculate_balance() in api/models/users.py:
 *   balance = (Σ order.received + Σ delivery.payment_amount)
 *           - (Σ order.total_costs + Σ delivery.weight_cost)
 * Django keeps this in sync via post_save signals; this app writes the
 * DB directly so we replicate it explicitly.
 */
async function recalculateClientBalance(clientId: bigint): Promise<void> {
  const [orderAgg, deliveryAgg] = await Promise.all([
    prisma.order.aggregate({
      where: { clientId },
      _sum: { receivedValueOfClient: true, totalCosts: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { clientId },
      _sum: { paymentAmount: true, weightCost: true },
    }),
  ]);
  const received =
    (orderAgg._sum.receivedValueOfClient ?? 0) +
    (deliveryAgg._sum.paymentAmount ?? 0);
  const cost =
    (orderAgg._sum.totalCosts ?? 0) + (deliveryAgg._sum.weightCost ?? 0);
  await prisma.customUser.update({
    where: { id: clientId },
    data: { balance: round2(received - cost) },
  });
}

export async function createOrderAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  const parsed = orderFormSchema.safeParse({
    clientId: formData.get('clientId'),
    salesManagerId: formData.get('salesManagerId') ?? '',
    status: formData.get('status'),
    observations: formData.get('observations') ?? '',
    receivedValueOfClient: formData.get('receivedValueOfClient') ?? 0,
    balanceApplied: formData.get('balanceApplied') ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const order = await prisma.order.create({
    data: {
      clientId: BigInt(d.clientId),
      salesManagerId: d.salesManagerId ? BigInt(d.salesManagerId) : null,
      status: d.status,
      observations: d.observations,
      receivedValueOfClient: d.receivedValueOfClient,
      balanceApplied: d.balanceApplied,
      payStatus: toDbPayStatus(
        computePayStatus(0, d.receivedValueOfClient, d.balanceApplied)
      ),
    },
  });
  await recalculateClientBalance(BigInt(d.clientId));

  revalidatePath('/orders');
  return { ok: true, id: order.id.toString() };
}

export async function updateOrderAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }
  const parsed = orderFormSchema.safeParse({
    clientId: formData.get('clientId'),
    salesManagerId: formData.get('salesManagerId') ?? '',
    status: formData.get('status'),
    observations: formData.get('observations') ?? '',
    receivedValueOfClient: formData.get('receivedValueOfClient') ?? 0,
    balanceApplied: formData.get('balanceApplied') ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const orderId = BigInt(idRaw);

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalCosts: true, clientId: true },
  });
  if (!existing) return { ok: false, error: 'Order not found' };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      clientId: BigInt(d.clientId),
      salesManagerId: d.salesManagerId ? BigInt(d.salesManagerId) : null,
      status: d.status,
      observations: d.observations,
      receivedValueOfClient: d.receivedValueOfClient,
      balanceApplied: d.balanceApplied,
      payStatus: toDbPayStatus(
        computePayStatus(
          existing.totalCosts,
          d.receivedValueOfClient,
          d.balanceApplied
        )
      ),
    },
  });

  // Client may have changed — recalc both old and new.
  await recalculateClientBalance(existing.clientId);
  if (existing.clientId.toString() !== d.clientId) {
    await recalculateClientBalance(BigInt(d.clientId));
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${idRaw}`);
  return { ok: true };
}

export async function deleteOrderAction(id: string): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  const orderId = BigInt(id);
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { clientId: true },
  });
  if (!existing) return { ok: false, error: 'Order not found' };

  try {
    await prisma.order.delete({ where: { id: orderId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      return {
        ok: false,
        error: 'Cannot delete: order has linked purchases or deliveries',
      };
    }
    throw err;
  }
  await recalculateClientBalance(existing.clientId);

  revalidatePath('/orders');
  return { ok: true };
}

async function upsertProduct(
  formData: FormData,
  orderId: bigint,
  productId?: string
): Promise<ActionResult> {
  const parsed = productFormSchema.safeParse({
    name: formData.get('name'),
    shopId: formData.get('shopId'),
    categoryId: formData.get('categoryId') ?? '',
    link: formData.get('link') ?? '',
    sku: formData.get('sku') ?? '',
    description: formData.get('description') ?? '',
    amountRequested: formData.get('amountRequested'),
    shopCost: formData.get('shopCost'),
    shopDeliveryCost: formData.get('shopDeliveryCost') ?? 0,
    shopTaxes: formData.get('shopTaxes') ?? 0,
    chargeIva: formData.get('chargeIva'),
    addedTaxes: formData.get('addedTaxes') ?? 0,
    ownTaxes: formData.get('ownTaxes') ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const cost = computeProductCost({
    shopCost: d.shopCost,
    amountRequested: d.amountRequested,
    shopDeliveryCost: d.shopDeliveryCost,
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    addedTaxes: d.addedTaxes,
    ownTaxes: d.ownTaxes,
  });

  const baseData = {
    name: d.name,
    shopId: BigInt(d.shopId),
    categoryId: d.categoryId ? BigInt(d.categoryId) : null,
    link: d.link,
    sku: d.sku,
    description: d.description,
    amountRequested: d.amountRequested,
    shopCost: d.shopCost,
    shopDeliveryCost: d.shopDeliveryCost,
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    baseTax: cost.baseTax,
    shopTaxAmount: cost.shopTaxAmount,
    ownTaxes: cost.ownTaxes,
    addedTaxes: cost.addedTaxes,
    totalCost: cost.totalCost,
  };

  try {
    if (productId) {
      const current = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          amountPurchased: true,
          amountReceived: true,
          amountDelivered: true,
        },
      });
      if (!current) return { ok: false, error: 'Product not found' };
      await prisma.product.update({
        where: { id: productId },
        data: {
          ...baseData,
          status: deriveProductStatus(
            d.amountRequested,
            current.amountPurchased,
            current.amountReceived,
            current.amountDelivered
          ),
        },
      });
    } else {
      await prisma.product.create({
        data: {
          ...baseData,
          orderId,
          status: deriveProductStatus(d.amountRequested, 0, 0, 0),
        },
      });
    }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Product not found' };
    }
    throw err;
  }

  await refreshOrderTotals(orderId);
  revalidatePath(`/orders/${orderId.toString()}`);
  revalidatePath('/orders');
  return { ok: true };
}

export async function createProductAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;
  const orderIdRaw = formData.get('orderId');
  if (typeof orderIdRaw !== 'string' || !orderIdRaw) {
    return { ok: false, error: 'Missing order id' };
  }
  return upsertProduct(formData, BigInt(orderIdRaw));
}

export async function updateProductAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;
  const orderIdRaw = formData.get('orderId');
  const productId = formData.get('productId');
  if (typeof orderIdRaw !== 'string' || !orderIdRaw) {
    return { ok: false, error: 'Missing order id' };
  }
  if (typeof productId !== 'string' || !productId) {
    return { ok: false, error: 'Missing product id' };
  }
  return upsertProduct(formData, BigInt(orderIdRaw), productId);
}

export async function deleteProductAction(
  orderId: string,
  productId: string
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return { ok: false, error: 'Product not found' };
      }
      if (err.code === 'P2003') {
        return {
          ok: false,
          error:
            'Cannot delete: product has linked purchases, receptions, or deliveries',
        };
      }
    }
    throw err;
  }

  await refreshOrderTotals(BigInt(orderId));
  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  return { ok: true };
}
