'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computePayStatus, round2 } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import {
  recomputeProductAmounts,
  recomputeProductsOfDelivery,
} from '@/lib/product-status';
import {
  addUnitsToOpenBag,
  deleteBagIfEmpty,
  emptyOpenBag,
} from '@/lib/open-bags';
import {
  affectsProductStatus,
  deliveryPhase,
  nextDeliveryStatus,
  type DeliveryAction,
} from '@/lib/delivery-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  assembleDeliverySchema,
  deliverSchema,
  deliveryEditSchema,
  deliveryItemsSchema,
  toDbDeliveryStatus,
  toDbPayStatus,
  type AssembleDeliveryInput,
  type DeliverInput,
  type DeliveryItemsInput,
  type ReceivedCandidate,
} from './schema';
import type { BagSummary } from '@/lib/open-bags';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

type Db = Prisma.TransactionClient;

/** Resultado de echar unidades a bolsas: a qué bolsas cayeron. */
export type BagFillResult = ActionResult & { bags?: BagSummary[] };

const TX_OPTIONS = { timeout: 60_000, maxWait: 10_000 } as const;

function revalidateDeliveryViews(deliveryId?: string) {
  revalidatePath('/delivery');
  if (deliveryId) revalidatePath(`/delivery/${deliveryId}`);
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  revalidatePath('/dashboard');
}

/**
 * RN-002 / RN-003:
 *   weight_cost    = weight × Category.client_shipping_charge
 *   manager_profit = weight × client.assignedAgent.agent_profit (0 si no hay)
 */
async function deriveCosts(
  db: Db,
  clientId: bigint,
  categoryId: bigint | null,
  weight: number
): Promise<{ weightCost: number; managerProfit: number }> {
  const [category, client] = await Promise.all([
    categoryId
      ? db.category.findUnique({
          where: { id: categoryId },
          select: { clientShippingCharge: true },
        })
      : Promise.resolve(null),
    db.customUser.findUnique({
      where: { id: clientId },
      select: { assignedAgent: { select: { agentProfit: true } } },
    }),
  ]);
  return {
    weightCost: round2(weight * (category?.clientShippingCharge ?? 0)),
    managerProfit: round2(weight * (client?.assignedAgent?.agentProfit ?? 0)),
  };
}

/** Cierra una bolsa con su peso: fija costos y estado de pago (INV-003). */
async function closeBagWithWeight(
  db: Db,
  delivery: {
    id: bigint;
    clientId: bigint;
    categoryId: bigint | null;
    paymentAmount: number;
    balanceApplied: number;
  },
  weight: number
): Promise<void> {
  const w = round2(weight);
  const { weightCost, managerProfit } = await deriveCosts(
    db,
    delivery.clientId,
    delivery.categoryId,
    w
  );
  await db.deliverReceip.update({
    where: { id: delivery.id },
    data: {
      weight: w,
      weightCost,
      managerProfit,
      paymentStatus: toDbPayStatus(
        computePayStatus(weightCost, delivery.paymentAmount, delivery.balanceApplied)
      ),
    },
  });
  await recalculateClientBalance(delivery.clientId, db);
}

/**
 * Echa unidades recibidas de un cliente a sus bolsas abiertas (una por
 * categoría), validando en la transacción disponible y categoría.
 */
async function fillBags(
  db: Db,
  items: { productId: string; amount: number }[],
  expectClientId?: bigint
): Promise<
  { ok: true; bags: BagSummary[]; bagIds: bigint[] } | { ok: false; error: string }
> {
  const ids = items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }
  const products = await db.product.findMany({
    where: { id: { in: ids } },
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
    if (!p) return { ok: false, error: 'Producto no encontrado' };
    if (expectClientId !== undefined && p.order.clientId !== expectClientId) {
      return { ok: false, error: `«${p.name}» no pertenece a este cliente` };
    }
    const available = p.amountReceived - p.amountDelivered;
    if (item.amount > available) {
      return {
        ok: false,
        error: `Solo quedan ${Math.max(0, available)} unidad(es) de «${p.name}» recibidas sin embolsar`,
      };
    }
    if (p.categoryId === null) {
      return {
        ok: false,
        error: `«${p.name}» no tiene categoría asignada; asígnala para poder embolsarlo`,
      };
    }
  }

  const bags = new Map<string, BagSummary>();
  for (const item of items) {
    const p = byId.get(item.productId)!;
    const { bagId, created } = await addUnitsToOpenBag(db, {
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
        clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        categoryName: p.category?.name ?? '',
        units: item.amount,
        created,
      });
    }
  }
  for (const item of items) {
    await recomputeProductAmounts(item.productId, db);
  }
  return {
    ok: true,
    bags: [...bags.values()],
    bagIds: [...bags.keys()].map((k) => BigInt(k)),
  };
}

/** Recibidos sin entregar de un cliente (para «Armar entrega»). */
export async function listReceivedForClientAction(
  clientId: string
): Promise<{ ok: true; items: ReceivedCandidate[] } | { ok: false; error: string }> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;
  const cid = parseId(clientId);
  if (!cid) return { ok: false, error: 'Cliente inválido' };

  const rows = await prisma.product.findMany({
    where: {
      order: { clientId: cid },
      amountReceived: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      orderId: true,
      amountReceived: true,
      amountDelivered: true,
      categoryId: true,
      category: { select: { name: true, clientShippingCharge: true } },
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    take: 500,
  });
  return {
    ok: true,
    items: rows
      .map((p) => ({
        id: p.id,
        name: p.name,
        orderId: p.orderId.toString(),
        categoryId: p.categoryId ? p.categoryId.toString() : null,
        categoryName: p.category?.name ?? null,
        chargePerLb: p.category?.clientShippingCharge ?? 0,
        available: p.amountReceived - p.amountDelivered,
      }))
      .filter((p) => p.available > 0),
  };
}

/**
 * «Armar entrega desde recibidos» (ADR-0004): llena la bolsa del
 * cliente con lo marcado y, si viene peso (una sola categoría), la
 * cierra en el mismo paso.
 */
export async function assembleDeliveryAction(
  input: AssembleDeliveryInput
): Promise<BagFillResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const parsed = assembleDeliverySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const clientId = parseId(d.clientId);
  if (!clientId) return { ok: false, error: 'Cliente inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const filled = await fillBags(tx, d.items, clientId);
    if (!filled.ok) return filled;
    if (d.weight !== undefined) {
      if (filled.bagIds.length !== 1) {
        return {
          ok: false as const,
          error:
            'Para pesar en el mismo paso, los productos deben ser de una sola categoría (una bolsa)',
        };
      }
      const bag = await tx.deliverReceip.findUnique({
        where: { id: filled.bagIds[0] },
        select: {
          id: true,
          clientId: true,
          categoryId: true,
          paymentAmount: true,
          balanceApplied: true,
        },
      });
      if (bag) await closeBagWithWeight(tx, bag, d.weight);
    }
    return { ok: true as const, bags: filled.bags, id: filled.bagIds[0]?.toString() };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidateDeliveryViews(result.id);
  return result;
}

/** Echar a mano recibidos sueltos a la bolsa abierta de su cliente+categoría. */
export async function addLooseToBagAction(
  items: DeliveryItemsInput
): Promise<BagFillResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const parsed = deliveryItemsSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const result = await prisma.$transaction(
    (tx) => fillBags(tx, parsed.data),
    TX_OPTIONS
  );
  if (!result.ok) return result;
  revalidateDeliveryViews();
  return { ok: true, bags: result.bags };
}

/**
 * Pesar una bolsa abierta la cierra (INV-003/INV-004): fija costo por
 * peso y ganancia del gestor. Una entrega ya pesada solo la corrige un
 * admin con correctDeliveryWeightAction.
 */
export async function registerBagWeightAction(
  id: string,
  weight: number
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const deliveryId = parseId(id);
  if (!deliveryId) return { ok: false, error: 'Identificador inválido' };
  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false, error: 'El peso debe ser mayor que 0' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        clientId: true,
        categoryId: true,
        status: true,
        weight: true,
        paymentAmount: true,
        balanceApplied: true,
        _count: { select: { deliveredProducts: true } },
      },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    if (deliveryPhase(delivery) !== 'En preparación') {
      return {
        ok: false as const,
        error:
          'Esta entrega ya está pesada; solo un administrador puede corregir el peso',
      };
    }
    if (delivery._count.deliveredProducts === 0) {
      return { ok: false as const, error: 'La bolsa está vacía' };
    }
    await closeBagWithWeight(tx, delivery, weight);
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidateDeliveryViews(id);
  return { ok: true, id };
}

/** Corrección de peso por un admin sobre una entrega ya pesada. */
export async function correctDeliveryWeightAction(
  id: string,
  weight: number
): Promise<ActionResult> {
  const { denied } = await requireRole(['admin']);
  if (denied) return denied;

  const deliveryId = parseId(id);
  if (!deliveryId) return { ok: false, error: 'Identificador inválido' };
  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false, error: 'El peso debe ser mayor que 0' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        clientId: true,
        categoryId: true,
        paymentAmount: true,
        balanceApplied: true,
      },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    await closeBagWithWeight(tx, delivery, weight);
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidateDeliveryViews(id);
  revalidatePath('/balance');
  return { ok: true, id };
}

/**
 * Ajuste de una fila de entrega: fijar unidades o quitarla (amount 0).
 * Permitido mientras la entrega esté Pendiente (bolsa abierta o pesada);
 * un admin también en tránsito; nunca en una entrega ya entregada. Las
 * unidades retiradas vuelven a «recibido sin bolsa»; la bolsa vacía se
 * borra.
 */
export async function adjustBagItemAction(
  productDeliveryId: string,
  amount: number
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const rowId = parseId(productDeliveryId);
  if (!rowId) return { ok: false, error: 'Identificador inválido' };
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
          select: { name: true, amountReceived: true, amountDelivered: true },
        },
      },
    });
    if (!row || row.deliverReceipId === null || !row.deliverReceip) {
      return { ok: false as const, error: 'Producto no encontrado en la entrega' };
    }
    const status = row.deliverReceip.status;
    const editable =
      status === 'Pendiente' || (status === 'En transito' && user.role === 'admin');
    if (!editable) {
      return {
        ok: false as const,
        error:
          status === 'Entregado'
            ? 'La entrega ya fue entregada; reábrela para modificar sus productos'
            : 'La entrega está en tránsito; devuélvela a pendiente para modificarla',
      };
    }
    if (amount === row.amountDelivered) return { ok: true as const };

    const delta = amount - row.amountDelivered;
    if (delta > 0) {
      const available =
        row.originalProduct.amountReceived - row.originalProduct.amountDelivered;
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
    return { ok: true as const, deliveryId: row.deliverReceipId.toString() };
  });

  if (!result.ok) return result;
  revalidateDeliveryViews(result.deliveryId);
  return { ok: true };
}

export async function removeDeliveredProductAction(
  _deliveryId: string,
  productDeliveryId: string
): Promise<ActionResult> {
  return adjustBagItemAction(productDeliveryId, 0);
}

/**
 * Añade recibidos del MISMO cliente (y misma categoría, si la entrega la
 * tiene) a una entrega Pendiente: bolsa abierta o ya pesada.
 */
export async function addProductsToDeliveryAction(
  deliveryId: string,
  items: DeliveryItemsInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const did = parseId(deliveryId);
  if (!did) return { ok: false, error: 'Identificador inválido' };
  const parsed = deliveryItemsSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const list = parsed.data;
  const ids = list.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: did },
      select: { clientId: true, categoryId: true, status: true },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    if (delivery.status !== 'Pendiente') {
      return {
        ok: false as const,
        error: 'Solo se añaden productos a entregas en estado «Pendiente»',
      };
    }
    const products = await tx.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        amountReceived: true,
        amountDelivered: true,
        categoryId: true,
        order: { select: { clientId: true } },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const item of list) {
      const p = byId.get(item.productId);
      if (!p) return { ok: false as const, error: 'Producto no encontrado' };
      if (p.order.clientId !== delivery.clientId) {
        return { ok: false as const, error: `«${p.name}» no es de este cliente` };
      }
      if (delivery.categoryId !== null && p.categoryId !== delivery.categoryId) {
        return {
          ok: false as const,
          error: `«${p.name}» es de otra categoría; va en la bolsa de su categoría`,
        };
      }
      const available = p.amountReceived - p.amountDelivered;
      if (item.amount > available) {
        return {
          ok: false as const,
          error: `Solo quedan ${Math.max(0, available)} unidad(es) de «${p.name}» recibidas sin entregar`,
        };
      }
    }
    for (const item of list) {
      const existing = await tx.productDelivery.findFirst({
        where: { deliverReceipId: did, originalProductId: item.productId },
        select: { id: true, amountDelivered: true },
      });
      if (existing) {
        await tx.productDelivery.update({
          where: { id: existing.id },
          data: { amountDelivered: existing.amountDelivered + item.amount },
        });
      } else {
        await tx.productDelivery.create({
          data: {
            deliverReceipId: did,
            originalProductId: item.productId,
            amountDelivered: item.amount,
          },
        });
      }
      await recomputeProductAmounts(item.productId, tx);
    }
    return { ok: true as const };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidateDeliveryViews(deliveryId);
  return { ok: true };
}

/**
 * Transición explícita de estado (INV-006). Entrar o salir de
 * «Entregado» recalcula el estado de todos sus productos (RN-011).
 */
export async function transitionDeliveryStatusAction(
  id: string,
  action: DeliveryAction,
  payload: DeliverInput = {}
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const deliveryId = parseId(id);
  if (!deliveryId) return { ok: false, error: 'Identificador inválido' };
  const parsed = deliverSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: deliveryId },
      select: {
        status: true,
        weight: true,
        deliverPicture: true,
        _count: { select: { deliveredProducts: true } },
      },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    const next = nextDeliveryStatus(
      {
        status: delivery.status,
        weight: delivery.weight,
        productCount: delivery._count.deliveredProducts,
      },
      action,
      user.role
    );
    if (!next.ok) return next;

    await tx.deliverReceip.update({
      where: { id: deliveryId },
      data: {
        status: toDbDeliveryStatus(next.to),
        ...(action === 'deliver' && {
          deliverDate: d.deliverDate ? new Date(d.deliverDate) : new Date(),
          deliverPicture: d.deliverPicture ?? delivery.deliverPicture,
        }),
      },
    });
    let recomputed = 0;
    if (affectsProductStatus(delivery.status, next.to)) {
      recomputed = await recomputeProductsOfDelivery(deliveryId, tx);
    }
    return { ok: true as const, to: next.to, recomputed };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidateDeliveryViews(id);
  return { ok: true, id };
}

/** Edición de fecha y foto (el resto cambia por acciones explícitas). */
export async function updateDeliveryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const id = parseId(formData.get('id'));
  if (!id) return { ok: false, error: 'Identificador inválido' };

  const parsed = deliveryEditSchema.safeParse({
    deliverDate: formData.get('deliverDate'),
    deliverPicture: formData.get('deliverPicture') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  try {
    await prisma.deliverReceip.update({
      where: { id },
      data: {
        deliverDate: new Date(parsed.data.deliverDate),
        deliverPicture: parsed.data.deliverPicture,
      },
    });
  } catch {
    return { ok: false, error: 'Entrega no encontrada' };
  }
  revalidatePath('/delivery');
  revalidatePath(`/delivery/${id}`);
  return { ok: true };
}

/**
 * Registro de pago de una entrega — mirrors DeliverReceip.add_payment()
 * in api/models/deliveries.py: payment_amount and balance_applied
 * ACCUMULATE, payment_status is recomputed against weight_cost (or
 * forced to Pagado), payment_date is stamped. Transactional with the
 * client-balance recalculation. No se cobra una bolsa sin peso.
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
  if (!deliveryId) return { ok: false, error: 'Identificador inválido' };
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
        weight: true,
        weightCost: true,
        paymentAmount: true,
        balanceApplied: true,
        clientId: true,
        client: { select: { balance: true } },
      },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    if (!(delivery.weight > 0)) {
      return { ok: false as const, error: 'Pesa la bolsa antes de cobrarla' };
    }

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
  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Borrar una entrega: una bolsa abierta se vacía (sus unidades vuelven
 * a «recibido sin bolsa») y se borra; una entrega con pagos nunca; una
 * pesada con productos exige quitarlos antes.
 */
export async function deleteDeliveryAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.delivery);
  if (denied) return denied;

  const did = parseId(id);
  if (!did) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliverReceip.findUnique({
      where: { id: did },
      select: {
        clientId: true,
        status: true,
        weight: true,
        paymentAmount: true,
        balanceApplied: true,
        _count: { select: { deliveredProducts: true } },
      },
    });
    if (!delivery) return { ok: false as const, error: 'Entrega no encontrada' };
    if (delivery.paymentAmount > 0 || delivery.balanceApplied > 0) {
      return {
        ok: false as const,
        error: 'La entrega tiene pagos registrados y no se puede eliminar',
      };
    }
    if (deliveryPhase(delivery) === 'En preparación') {
      const productIds = await emptyOpenBag(tx, did);
      for (const pid of productIds) await recomputeProductAmounts(pid, tx);
      // emptyOpenBag ya borró la bolsa si quedó vacía.
      const still = await tx.deliverReceip.findUnique({ where: { id: did }, select: { id: true } });
      if (still) await tx.deliverReceip.delete({ where: { id: did } });
    } else {
      if (delivery._count.deliveredProducts > 0) {
        return {
          ok: false as const,
          error:
            'La entrega tiene productos: quítalos (o reábrela) antes de eliminarla',
        };
      }
      await tx.deliverReceip.delete({ where: { id: did } });
    }
    await recalculateClientBalance(delivery.clientId, tx);
    return { ok: true as const };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidateDeliveryViews();
  return { ok: true };
}
