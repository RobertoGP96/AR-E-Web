'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  computeProductCost,
  computePayStatus,
  deriveProductStatus,
  round2,
} from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  orderFormSchema,
  productFormSchema,
  toDbPayStatus,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/**
 * Mirrors Order.update_total_costs() + the pay_status branch in
 * api/models/orders.py. Always run inside (or right after) a product
 * mutation so the cached total stays correct. Runs as one transaction
 * so concurrent product edits cannot persist a stale total.
 */
async function refreshOrderTotals(orderId: bigint): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { orderId },
      select: { totalCost: true },
    });
    const totalCosts = round2(
      products.reduce((sum, p) => sum + p.totalCost, 0)
    );
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        receivedValueOfClient: true,
        balanceApplied: true,
        clientId: true,
      },
    });
    if (!order) return;
    const payStatus = computePayStatus(
      totalCosts,
      order.receivedValueOfClient,
      order.balanceApplied
    );
    await tx.order.update({
      where: { id: orderId },
      data: { totalCosts, payStatus: toDbPayStatus(payStatus) },
    });
    await recalculateClientBalance(order.clientId, tx);
  });
}

export async function createOrderAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const parsed = orderFormSchema.safeParse({
    clientId: formData.get('clientId'),
    salesManagerId: formData.get('salesManagerId') ?? '',
    status: formData.get('status'),
    observations: formData.get('observations') ?? '',
  });
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
  // Un agente siempre crea órdenes a su propio nombre: el gestor se
  // fija en el servidor, ignorando lo que venga del formulario.
  const managerRaw = user.role === 'agent' ? user.id : d.salesManagerId;
  const salesManagerId = managerRaw ? parseId(managerRaw) : null;
  if (managerRaw && !salesManagerId) {
    return { ok: false, error: 'Invalid sales manager id' };
  }

  const order = await prisma.order.create({
    data: {
      clientId,
      salesManagerId,
      status: d.status,
      observations: d.observations,
      receivedValueOfClient: 0,
      balanceApplied: 0,
      payStatus: toDbPayStatus(computePayStatus(0, 0, 0)),
    },
  });
  await recalculateClientBalance(clientId);

  revalidatePath('/orders');
  return { ok: true, id: order.id.toString() };
}

export async function updateOrderAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const orderId = parseId(formData.get('id'));
  if (!orderId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = orderFormSchema.safeParse({
    clientId: formData.get('clientId'),
    salesManagerId: formData.get('salesManagerId') ?? '',
    status: formData.get('status'),
    observations: formData.get('observations') ?? '',
  });
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
  // Igual que en create: un agente no puede reasignar la orden a otro
  // gestor, así que el servidor fija su propio id.
  const managerRaw = user.role === 'agent' ? user.id : d.salesManagerId;
  const salesManagerId = managerRaw ? parseId(managerRaw) : null;
  if (managerRaw && !salesManagerId) {
    return { ok: false, error: 'Invalid sales manager id' };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalCosts: true, clientId: true },
  });
  if (!existing) return { ok: false, error: 'Order not found' };

  // receivedValueOfClient / balanceApplied / payStatus no se tocan
  // aquí: los pagos se registran con confirmOrderPaymentAction.
  await prisma.order.update({
    where: { id: orderId },
    data: {
      clientId,
      salesManagerId,
      status: d.status,
      observations: d.observations,
    },
  });

  // Client may have changed — recalc both old and new.
  await recalculateClientBalance(existing.clientId);
  if (existing.clientId !== clientId) {
    await recalculateClientBalance(clientId);
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId.toString()}`);
  return { ok: true };
}

/**
 * Registro de pago — mirrors Order.add_received_value() in
 * api/models/orders.py: the paid amount ACCUMULATES into
 * received_value_of_client, the applied balance ACCUMULATES into
 * balance_applied, and pay_status is recomputed from the new totals
 * (or forced to Pagado when marked manually). Runs in a transaction
 * with the client-balance recalculation.
 */
export async function confirmOrderPaymentAction(
  id: string,
  amount: number,
  applyBalance: number,
  markPaidManually: boolean
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const orderId = parseId(id);
  if (!orderId) return { ok: false, error: 'Invalid order id' };
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
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
        clientId: true,
        client: { select: { balance: true } },
      },
    });
    if (!order) return { ok: false as const, error: 'Order not found' };

    const available = Math.max(0, order.client.balance);
    if (applyBalance > available) {
      return {
        ok: false as const,
        error: `El cliente solo tiene ${round2(available).toFixed(2)} de saldo a favor`,
      };
    }

    const newReceived = round2(order.receivedValueOfClient + amount);
    const newApplied = round2(order.balanceApplied + applyBalance);
    const payStatus = markPaidManually
      ? 'Pagado'
      : computePayStatus(order.totalCosts, newReceived, newApplied);

    await tx.order.update({
      where: { id: orderId },
      data: {
        receivedValueOfClient: newReceived,
        balanceApplied: newApplied,
        payStatus: toDbPayStatus(payStatus),
        paymentDate: new Date(),
      },
    });
    await recalculateClientBalance(order.clientId, tx);
    return { ok: true as const };
  });

  if (!result.ok) return result;

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  return { ok: true };
}

export async function deleteOrderAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const orderId = parseId(id);
  if (!orderId) return { ok: false, error: 'Invalid order id' };
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
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const shopId = parseId(d.shopId);
  if (!shopId) return { ok: false, error: 'Invalid shop id' };
  const categoryId = d.categoryId ? parseId(d.categoryId) : null;
  if (d.categoryId && !categoryId) {
    return { ok: false, error: 'Invalid category id' };
  }

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
    shopId,
    categoryId,
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
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;
  const orderId = parseId(formData.get('orderId'));
  if (!orderId) return { ok: false, error: 'Missing or invalid order id' };
  return upsertProduct(formData, orderId);
}

export async function updateProductAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;
  const orderId = parseId(formData.get('orderId'));
  const productId = formData.get('productId');
  if (!orderId) return { ok: false, error: 'Missing or invalid order id' };
  if (typeof productId !== 'string' || !productId) {
    return { ok: false, error: 'Missing product id' };
  }
  return upsertProduct(formData, orderId, productId);
}

export async function deleteProductAction(
  orderId: string,
  productId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const oid = parseId(orderId);
  if (!oid) return { ok: false, error: 'Invalid order id' };

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

  await refreshOrderTotals(oid);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  return { ok: true };
}
