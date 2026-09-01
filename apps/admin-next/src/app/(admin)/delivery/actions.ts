'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computePayStatus, round2 } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  addUnitsToOpenBag,
  deleteBagIfEmpty,
} from '@/lib/open-bags';
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
import type { BagSummary } from '@/lib/open-bags';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/** Resultado de echar sueltos a bolsas: a qué bolsas cayeron. */
export type BagFillResult = ActionResult & { bags?: BagSummary[] };

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
 * Pesar una bolsa del flujo /delivery/prepare. Registrar un peso > 0 es
 * lo que cierra la bolsa: deja de ser candidata al auto-llenado (las
 * llegadas posteriores de esa categoría abren otra) y aquí nacen el
 * costo por peso y la ganancia del gestor. El estado de pago se
 * recalcula contra el nuevo costo con los pagos ya registrados.
 */
export async function registerBagWeightAction(
  id: string,
  weight: number
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const deliveryId = parseId(id);
  if (!deliveryId) return { ok: false, error: 'Invalid delivery id' };
  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false, error: 'El peso debe ser mayor que 0' };
  }

  const delivery = await prisma.deliverReceip.findUnique({
    where: { id: deliveryId },
    select: {
      clientId: true,
      categoryId: true,
      status: true,
      paymentAmount: true,
      balanceApplied: true,
    },
  });
  if (!delivery) return { ok: false, error: 'Delivery not found' };
  if (delivery.status !== toDbDeliveryStatus('Pendiente')) {
    return {
      ok: false,
      error: 'Solo se pesan entregas en estado «Pendiente»',
    };
  }

  const w = round2(weight);
  const { weightCost, managerProfit } = await deriveCosts(
    delivery.clientId,
    delivery.categoryId,
    w
  );
  const payStatus = computePayStatus(
    weightCost,
    delivery.paymentAmount,
    delivery.balanceApplied
  );

  await prisma.deliverReceip.update({
    where: { id: deliveryId },
    data: {
      weight: w,
      weightCost,
      managerProfit,
      paymentStatus: toDbPayStatus(payStatus),
    },
  });
  await recalculateClientBalance(delivery.clientId);

  revalidatePath('/delivery');
  revalidatePath(`/delivery/${id}`);
  revalidatePath('/delivery/prepare');
  return { ok: true, id };
}

/**
 * Ajuste manual de una bolsa abierta (peso 0): fijar las unidades de una
 * fila o quitarla con amount 0. Cubre el error físico de echar algo en
 * la bolsa equivocada; las unidades retiradas vuelven a «recibido sin
 * bolsa». Si la bolsa queda vacía se borra.
 */
export async function adjustBagItemAction(
  productDeliveryId: string,
  amount: number
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const rowId = parseId(productDeliveryId);
  if (!rowId) return { ok: false, error: 'Invalid row id' };
  if (!Number.isInteger(amount) || amount < 0) {
    return { ok: false, error: 'La cantidad debe ser un entero ≥ 0' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.productDelivery.findUnique({
      where: { id: rowId },
      select: {
        amountDelivered: true,
        deliverReceipId: true,
        originalProductId: true,
        deliverReceip: { select: { status: true, weight: true } },
        originalProduct: {
          select: {
            name: true,
            amountReceived: true,
            amountDelivered: true,
          },
        },
      },
    });
    if (!row || row.deliverReceipId === null || !row.deliverReceip) {
      return { ok: false as const, error: 'Producto no encontrado en la bolsa' };
    }
    if (
      row.deliverReceip.status !== toDbDeliveryStatus('Pendiente') ||
      row.deliverReceip.weight !== 0
    ) {
      return {
        ok: false as const,
        error:
          'La bolsa ya está pesada o despachada; edítala desde el detalle de la entrega',
      };
    }
    if (amount === row.amountDelivered) return { ok: true as const };

    const delta = amount - row.amountDelivered;
    if (delta > 0) {
      const available =
        row.originalProduct.amountReceived -
        row.originalProduct.amountDelivered;
      if (delta > available) {
        return {
          ok: false as const,
          error: `Solo hay ${Math.max(0, available)} unidad(es) de «${row.originalProduct.name}» recibidas sin bolsa`,
        };
      }
    }

    if (amount === 0) {
      await tx.productDelivery.delete({ where: { id: rowId } });
    } else {
      await tx.productDelivery.update({
        where: { id: rowId },
        data: { amountDelivered: amount },
      });
    }
    await recomputeProductAmounts(row.originalProductId, tx);
    await deleteBagIfEmpty(tx, row.deliverReceipId);
    return { ok: true as const };
  });

  if (!result.ok) return result;

  revalidatePath('/delivery');
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return { ok: true };
}

/**
 * Echar a mano unidades recibidas que quedaron sueltas (recibidas antes
 * del auto-llenado, o retiradas de una bolsa) a la bolsa abierta de su
 * cliente+categoría, creándola si no existe. Mismo destino que el
 * auto-llenado de registerArrivalsAction.
 */
export async function addLooseToBagAction(
  items: { productId: string; amount: number }[]
): Promise<BagFillResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Selecciona al menos un producto' };
  }
  for (const item of items) {
    if (
      typeof item.productId !== 'string' ||
      item.productId.length === 0 ||
      !Number.isInteger(item.amount) ||
      item.amount <= 0
    ) {
      return { ok: false, error: 'Datos inválidos' };
    }
  }
  const productIds = items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          amountReceived: true,
          amountDelivered: true,
          categoryId: true,
          category: { select: { name: true } },
          order: {
            select: {
              clientId: true,
              client: { select: { name: true, lastName: true } },
            },
          },
        },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        const p = byId.get(item.productId);
        if (!p) return { ok: false as const, error: 'Producto no encontrado' };
        const available = p.amountReceived - p.amountDelivered;
        if (item.amount > available) {
          return {
            ok: false as const,
            error: `Solo quedan ${Math.max(0, available)} unidad(es) de «${p.name}» recibidas sin bolsa`,
          };
        }
        if (p.categoryId === null) {
          return {
            ok: false as const,
            error: `«${p.name}» no tiene categoría asignada; asígnala en su orden para poder embolsarlo`,
          };
        }
      }

      const bags = new Map<string, BagSummary>();
      for (const item of items) {
        const p = byId.get(item.productId)!;
        const { bagId, created } = await addUnitsToOpenBag(tx, {
          productId: item.productId,
          clientId: p.order.clientId,
          categoryId: p.categoryId!,
          amount: item.amount,
        });
        const key = bagId.toString();
        const entry = bags.get(key);
        if (entry) {
          entry.units += item.amount;
          entry.created = entry.created || created;
        } else {
          bags.set(key, {
            deliveryId: key,
            clientName:
              `${p.order.client.name} ${p.order.client.lastName}`.trim(),
            categoryName: p.category?.name ?? '',
            units: item.amount,
            created,
          });
        }
      }
      for (const item of items) {
        await recomputeProductAmounts(item.productId, tx);
      }
      return { ok: true as const, bags: [...bags.values()] };
    },
    // Un lote grande recalcula muchos productos sobre el driver de
    // Neon; el timeout por defecto (5 s) se queda corto.
    { timeout: 60_000, maxWait: 10_000 }
  );

  if (!result.ok) return result;

  revalidatePath('/delivery');
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return result;
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
