'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getGeneralAdminId } from '@/lib/general-admin';
import { isSalesManagerRole, resolveSalesManagerId } from '@/lib/order-manager';
import {
  computeProductCost,
  computePayStatus,
  deriveProductStatus,
  round2,
} from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import { recomputeOrderStatus } from '@/lib/product-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  orderFormSchema,
  productFormSchema,
  productDraftSchema,
  orderWithProductsSchema,
  addProductsSchema,
  toDbPayStatus,
  type OrderWithProductsInput,
  type AddProductsInput,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/**
 * Mirrors Order.update_total_costs() + the pay_status branch in
 * api/models/orders.py. Always run inside (or right after) a product
 * mutation so the cached total stays correct. Runs as one transaction
 * so concurrent product edits cannot persist a stale total.
 */
async function refreshOrderTotalsInTx(
  tx: Prisma.TransactionClient,
  orderId: bigint
): Promise<void> {
  const products = await tx.product.findMany({
    where: { orderId },
    select: { totalCost: true },
  });
  const totalCosts = round2(products.reduce((sum, p) => sum + p.totalCost, 0));
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
  // RN-012: añadir/quitar/editar productos puede cambiar el estado.
  await recomputeOrderStatus(orderId, tx);
  await recalculateClientBalance(order.clientId, tx);
}

async function refreshOrderTotals(orderId: bigint): Promise<void> {
  await prisma.$transaction((tx) => refreshOrderTotalsInTx(tx, orderId));
}

/**
 * Gestor de la orden (ADR-0007): un agente siempre a su propio nombre;
 * para el resto, el gestor pedido o, si no hay, el admin general. El
 * gestor debe ser personal activo.
 */
async function resolveManager(
  user: { id: string; role: string },
  requested: string | null
): Promise<{ ok: true; id: bigint | null } | { ok: false; error: string }> {
  const resolved = resolveSalesManagerId({
    creatorRole: user.role,
    creatorId: user.id,
    requested,
    generalAdminId: user.role === 'agent' ? null : await getGeneralAdminId(),
  });
  if (!resolved) return { ok: true, id: null };
  const id = parseId(resolved);
  if (!id) return { ok: false, error: 'Gestor inválido' };
  const staff = await prisma.customUser.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!staff || !staff.isActive || !isSalesManagerRole(staff.role)) {
    return {
      ok: false,
      error: 'El gestor debe ser personal activo (admin, agente, contador o logístico)',
    };
  }
  return { ok: true, id };
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
  // ADR-0007: agente a su nombre; si no, el gestor pedido o el admin general.
  const manager = await resolveManager(user, d.salesManagerId);
  if (!manager.ok) return { ok: false, error: manager.error };
  const salesManagerId = manager.id;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        clientId,
        salesManagerId,
        status: d.status,
        observations: d.observations,
        receivedValueOfClient: 0,
        balanceApplied: 0,
        payStatus: toDbPayStatus(computePayStatus(0, 0, 0)),
      },
      select: { id: true },
    });
    await recalculateClientBalance(clientId, tx);
    return created;
  });

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
  // ADR-0007: agente a su nombre; si no, el gestor pedido o el admin general.
  const manager = await resolveManager(user, d.salesManagerId);
  if (!manager.ok) return { ok: false, error: manager.error };
  const salesManagerId = manager.id;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: { totalCosts: true, clientId: true },
    });
    if (!existing) return { ok: false as const, error: 'Orden no encontrada' };

    // receivedValueOfClient / balanceApplied / payStatus no se tocan
    // aquí: los pagos se registran con confirmOrderPaymentAction.
    await tx.order.update({
      where: { id: orderId },
      data: {
        clientId,
        salesManagerId,
        status: d.status,
        observations: d.observations,
      },
    });
    // El estado manual solo vale para cancelar/reactivar; el resto se
    // deriva de los productos (RN-012).
    await recomputeOrderStatus(orderId, tx);

    // Client may have changed — recalc both old and new.
    await recalculateClientBalance(existing.clientId, tx);
    if (existing.clientId !== clientId) {
      await recalculateClientBalance(clientId, tx);
    }
    return { ok: true as const };
  });
  if (!result.ok) return result;

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
  if (!orderId) return { ok: false, error: 'Identificador inválido' };

  // Las FK de la BD (de Django) no tienen cascada: los productos se
  // borran explícitamente, y solo si ninguno tiene compras, recepciones
  // o entregas.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        clientId: true,
        products: {
          select: {
            name: true,
            _count: { select: { buys: true, receiveds: true, delivers: true } },
          },
        },
      },
    });
    if (!existing) return { ok: false as const, error: 'Orden no encontrada' };
    const busy = existing.products.find(
      (p) => p._count.buys + p._count.receiveds + p._count.delivers > 0
    );
    if (busy) {
      return {
        ok: false as const,
        error: `No se puede eliminar: «${busy.name}» tiene compras, recepciones o entregas. Cancela la orden en su lugar.`,
      };
    }
    await tx.product.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
    await recalculateClientBalance(existing.clientId, tx);
    return { ok: true as const };
  });
  if (!result.ok) return result;

  revalidatePath('/orders');
  revalidatePath('/products');
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
  const categoryId = parseId(d.categoryId);
  if (!categoryId) return { ok: false, error: 'Invalid category id' };

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
            'No se puede eliminar: el producto tiene compras, recepciones o entregas',
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

/** Datos de producto listos para Prisma a partir de un borrador validado. */
function productDataFromDraft(d: ProductDraftParsed) {
  const shopId = parseId(d.shopId);
  const categoryId = parseId(d.categoryId);
  if (!shopId || !categoryId) return null;
  const cost = computeProductCost({
    shopCost: d.shopCost,
    amountRequested: d.amountRequested,
    shopDeliveryCost: d.shopDeliveryCost,
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    addedTaxes: d.addedTaxes,
    ownTaxes: d.ownTaxes,
  });
  return {
    name: d.name,
    shopId,
    categoryId,
    link: d.link,
    sku: d.sku,
    description: d.description,
    amountRequested: d.amountRequested,
    shopCost: round2(d.shopCost),
    shopDeliveryCost: round2(d.shopDeliveryCost),
    shopTaxes: d.shopTaxes,
    chargeIva: d.chargeIva,
    baseTax: cost.baseTax,
    shopTaxAmount: cost.shopTaxAmount,
    ownTaxes: cost.ownTaxes,
    addedTaxes: cost.addedTaxes,
    totalCost: cost.totalCost,
    status: deriveProductStatus(d.amountRequested, 0, 0, 0),
  };
}

type ProductDraftParsed = z.output<typeof productDraftSchema>;

/**
 * Alta de orden con sus productos en la misma vista (/orders/new): una
 * sola transacción crea la orden, todos los productos con su cascada
 * de costos, el total y el balance del cliente.
 */
export async function createOrderWithProductsAction(
  input: OrderWithProductsInput
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const parsed = orderWithProductsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const clientId = parseId(d.clientId);
  if (!clientId) return { ok: false, error: 'Cliente inválido' };
  // ADR-0007: agente a su nombre; si no, el gestor pedido o el admin general.
  const manager = await resolveManager(user, d.salesManagerId);
  if (!manager.ok) return { ok: false, error: manager.error };
  const salesManagerId = manager.id;

  const rows = d.products.map(productDataFromDraft);
  if (rows.some((r) => r === null)) {
    return { ok: false, error: 'Tienda o categoría inválida en algún producto' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.customUser.findUnique({
      where: { id: clientId },
      select: { role: true },
    });
    if (!client || client.role !== 'client') {
      return { ok: false as const, error: 'Cliente no encontrado' };
    }
    const order = await tx.order.create({
      data: {
        clientId,
        salesManagerId,
        status: 'Encargado',
        observations: d.observations,
        receivedValueOfClient: 0,
        balanceApplied: 0,
        payStatus: toDbPayStatus(computePayStatus(0, 0, 0)),
      },
      select: { id: true },
    });
    await tx.product.createMany({
      data: rows.map((r) => ({ ...r!, orderId: order.id })),
    });
    await refreshOrderTotalsInTx(tx, order.id);
    return { ok: true as const, id: order.id.toString() };
  }, { timeout: 60_000, maxWait: 10_000 });

  if (!result.ok) return result;
  revalidatePath('/orders');
  revalidatePath('/products');
  revalidatePath('/purchases/new');
  return { ok: true, id: result.id };
}

/** Añade varios productos a una orden existente (detalle de la orden). */
export async function addProductsToOrderAction(
  input: AddProductsInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.orders);
  if (denied) return denied;

  const parsed = addProductsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }
  const d = parsed.data;
  const orderId = parseId(d.orderId);
  if (!orderId) return { ok: false, error: 'Orden inválida' };
  const rows = d.products.map(productDataFromDraft);
  if (rows.some((r) => r === null)) {
    return { ok: false, error: 'Tienda o categoría inválida en algún producto' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (!order) return { ok: false as const, error: 'Orden no encontrada' };
    if (order.status === 'Cancelado') {
      return { ok: false as const, error: 'La orden está cancelada' };
    }
    await tx.product.createMany({
      data: rows.map((r) => ({ ...r!, orderId })),
    });
    await refreshOrderTotalsInTx(tx, orderId);
    return { ok: true as const };
  }, { timeout: 60_000, maxWait: 10_000 });

  if (!result.ok) return result;
  revalidatePath('/orders');
  revalidatePath(`/orders/${d.orderId}`);
  revalidatePath('/products');
  revalidatePath('/purchases/new');
  return { ok: true };
}
