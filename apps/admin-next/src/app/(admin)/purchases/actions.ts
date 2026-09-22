'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { recomputeProductAmounts } from '@/lib/product-status';
import { estimatePurchaseTotal, round2 } from '@/lib/order-cost';
import {
  appendRefundNote,
  canRefund,
  canRemoveBuyed,
} from '@/lib/purchase-rules';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  addPurchaseItemsSchema,
  createPurchaseBatchSchema,
  purchaseFormSchema,
  toDbPayStatus,
  type AddPurchaseItemsInput,
  type CreatePurchaseBatchInput,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

type Tx = Prisma.TransactionClient;

const TX_OPTIONS = { timeout: 60_000, maxWait: 10_000 } as const;

/** Rutas que muestran cantidades/estado de productos comprados. */
function revalidatePurchaseViews(purchaseId?: string, orderIds: string[] = []) {
  revalidatePath('/purchases');
  revalidatePath('/purchases/new');
  if (purchaseId) revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath('/orders');
  for (const id of orderIds) revalidatePath(`/orders/${id}`);
  revalidatePath('/products');
  revalidatePath('/delivery/prepare');
  revalidatePath('/packages/[id]', 'page');
}

/**
 * INV-005 + INV-001: valida un lote de productos contra la tienda de la
 * compra y contra lo pendiente releído dentro de la transacción.
 * Devuelve los productos cargados o el primer error.
 */
async function validateBatch(
  tx: Tx,
  shopId: bigint,
  shopName: string,
  items: { productId: string; amount: number }[]
): Promise<
  | { ok: true; products: Map<string, BatchProduct> }
  | { ok: false; error: string }
> {
  const ids = items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }
  const rows = await tx.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      shopId: true,
      orderId: true,
      amountRequested: true,
      amountPurchased: true,
      shopCost: true,
      shopDeliveryCost: true,
      shopTaxes: true,
      chargeIva: true,
      addedTaxes: true,
      ownTaxes: true,
      totalCost: true,
      order: { select: { status: true } },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) return { ok: false, error: 'Producto no encontrado' };
    if (p.shopId !== shopId) {
      return {
        ok: false,
        error: `«${p.name}» no es un producto de ${shopName}`,
      };
    }
    if (p.order.status === 'Cancelado') {
      return {
        ok: false,
        error: `«${p.name}» pertenece a una orden cancelada`,
      };
    }
    const remaining = p.amountRequested - p.amountPurchased;
    if (item.amount > remaining) {
      return {
        ok: false,
        error: `Solo quedan ${Math.max(0, remaining)} unidad(es) de «${p.name}» pendientes de comprar`,
      };
    }
  }
  return { ok: true, products: byId };
}

type BatchProduct = {
  id: string;
  name: string;
  shopId: bigint;
  orderId: bigint;
  amountRequested: number;
  amountPurchased: number;
  shopCost: number;
  shopDeliveryCost: number;
  shopTaxes: number;
  chargeIva: boolean;
  addedTaxes: number;
  ownTaxes: number;
  totalCost: number;
};

function estimateBatch(
  products: Map<string, BatchProduct>,
  items: { productId: string; amount: number }[]
): number {
  return estimatePurchaseTotal(
    items.map((i) => ({ product: products.get(i.productId)!, units: i.amount }))
  );
}

/**
 * Compra nueva a partir de productos pendientes (ADR-0002): cabecera +
 * todos los ProductBuyed + recompute en una sola transacción.
 */
export async function createPurchaseWithProductsAction(
  input: CreatePurchaseBatchInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const parsed = createPurchaseBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const shopId = parseId(d.shopOfBuyId);
  const accountId = parseId(d.shoppingAccountId);
  if (!shopId || !accountId) {
    return { ok: false, error: 'Tienda o cuenta inválida' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const [shop, account] = await Promise.all([
      tx.shop.findUnique({ where: { id: shopId }, select: { name: true } }),
      tx.buyingAccounts.findUnique({
        where: { id: accountId },
        select: { shopId: true },
      }),
    ]);
    if (!shop) return { ok: false as const, error: 'Tienda no encontrada' };
    if (!account || account.shopId !== shopId) {
      return {
        ok: false as const,
        error: 'La cuenta de compra no pertenece a la tienda seleccionada',
      };
    }
    const batch = await validateBatch(tx, shopId, shop.name, d.items);
    if (!batch.ok) return batch;

    const buyDate = new Date(d.buyDate);
    const receipt = await tx.shoppingReceip.create({
      data: {
        shopOfBuyId: shopId,
        shoppingAccountId: accountId,
        statusOfShopping: toDbPayStatus(d.statusOfShopping),
        cardId: d.cardId,
        buyDate,
        totalCostOfPurchase: round2(d.totalCostOfPurchase),
      },
      select: { id: true },
    });
    await tx.productBuyed.createMany({
      data: d.items.map((i) => ({
        shopingReceipId: receipt.id,
        originalProductId: i.productId,
        amountBuyed: i.amount,
        buyDate,
      })),
    });
    for (const item of d.items) {
      await recomputeProductAmounts(item.productId, tx);
    }
    const orderIds = [
      ...new Set(
        d.items.map((i) => batch.products.get(i.productId)!.orderId.toString())
      ),
    ];
    return { ok: true as const, id: receipt.id.toString(), orderIds };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidatePurchaseViews(result.id, result.orderIds);
  return { ok: true, id: result.id };
}

/** Añade un lote de productos a una compra existente (misma tienda). */
export async function addPurchaseItemsAction(
  input: AddPurchaseItemsInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const parsed = addPurchaseItemsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }
  const d = parsed.data;
  const pid = parseId(d.purchaseId);
  if (!pid) return { ok: false, error: 'Compra inválida' };

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.shoppingReceip.findUnique({
      where: { id: pid },
      select: {
        shopOfBuyId: true,
        buyDate: true,
        shopOfBuy: { select: { name: true } },
      },
    });
    if (!purchase) return { ok: false as const, error: 'Compra no encontrada' };
    const batch = await validateBatch(
      tx,
      purchase.shopOfBuyId,
      purchase.shopOfBuy.name,
      d.items
    );
    if (!batch.ok) return batch;

    await tx.productBuyed.createMany({
      data: d.items.map((i) => ({
        shopingReceipId: pid,
        originalProductId: i.productId,
        amountBuyed: i.amount,
        buyDate: purchase.buyDate,
      })),
    });
    if (d.addToTotal) {
      const estimate = estimateBatch(batch.products, d.items);
      if (estimate > 0) {
        await tx.shoppingReceip.update({
          where: { id: pid },
          data: { totalCostOfPurchase: { increment: estimate } },
        });
      }
    }
    for (const item of d.items) {
      await recomputeProductAmounts(item.productId, tx);
    }
    const orderIds = [
      ...new Set(
        d.items.map((i) => batch.products.get(i.productId)!.orderId.toString())
      ),
    ];
    return { ok: true as const, orderIds };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidatePurchaseViews(d.purchaseId, result.orderIds);
  return { ok: true, id: d.purchaseId };
}

/** Edición de la cabecera (la tienda no cambia si ya hay productos). */
export async function updatePurchaseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const id = parseId(formData.get('id'));
  if (!id) return { ok: false, error: 'Identificador inválido' };

  const parsed = purchaseFormSchema.safeParse({
    shopOfBuyId: formData.get('shopOfBuyId'),
    shoppingAccountId: formData.get('shoppingAccountId'),
    statusOfShopping: formData.get('statusOfShopping'),
    cardId: formData.get('cardId') ?? '',
    buyDate: formData.get('buyDate'),
    totalCostOfPurchase: formData.get('totalCostOfPurchase') ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const shopOfBuyId = parseId(d.shopOfBuyId);
  const shoppingAccountId = parseId(d.shoppingAccountId);
  if (!shopOfBuyId || !shoppingAccountId) {
    return { ok: false, error: 'Tienda o cuenta inválida' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const [existing, account] = await Promise.all([
      tx.shoppingReceip.findUnique({
        where: { id },
        select: {
          shopOfBuyId: true,
          _count: { select: { buyedProducts: true } },
        },
      }),
      tx.buyingAccounts.findUnique({
        where: { id: shoppingAccountId },
        select: { shopId: true },
      }),
    ]);
    if (!existing) return { ok: false as const, error: 'Compra no encontrada' };
    if (
      existing.shopOfBuyId !== shopOfBuyId &&
      existing._count.buyedProducts > 0
    ) {
      return {
        ok: false as const,
        error: 'No se puede cambiar la tienda de una compra con productos',
        fieldErrors: { shopOfBuyId: 'La compra ya tiene productos' } as Record<string, string>,
      };
    }
    if (!account || account.shopId !== shopOfBuyId) {
      return {
        ok: false as const,
        error: 'La cuenta de compra no pertenece a la tienda seleccionada',
        fieldErrors: { shoppingAccountId: 'Cuenta de otra tienda' } as Record<string, string>,
      };
    }
    await tx.shoppingReceip.update({
      where: { id },
      data: {
        shopOfBuyId,
        shoppingAccountId,
        statusOfShopping: toDbPayStatus(d.statusOfShopping),
        cardId: d.cardId,
        buyDate: new Date(d.buyDate),
        totalCostOfPurchase: round2(d.totalCostOfPurchase),
      },
    });
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidatePath('/purchases');
  revalidatePath(`/purchases/${id}`);
  return { ok: true };
}

/** Quitar una fila comprada respetando lo ya recibido (INV-001). */
export async function removeBuyedProductAction(
  purchaseId: string,
  buyedProductId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const pid = parseId(purchaseId);
  const rowId = parseId(buyedProductId);
  if (!pid || !rowId) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.productBuyed.findUnique({
      where: { id: rowId },
      select: {
        shopingReceipId: true,
        amountBuyed: true,
        quantityRefuned: true,
        originalProductId: true,
        originalProduct: {
          select: {
            name: true,
            amountPurchased: true,
            amountReceived: true,
            orderId: true,
          },
        },
      },
    });
    if (!row || row.shopingReceipId !== pid) {
      return { ok: false as const, error: 'El producto no pertenece a esta compra' };
    }
    const blocked = canRemoveBuyed(row.originalProduct, row);
    if (blocked) return { ok: false as const, error: blocked };

    await tx.productBuyed.delete({ where: { id: rowId } });
    await recomputeProductAmounts(row.originalProductId, tx);
    return { ok: true as const, orderId: row.originalProduct.orderId.toString() };
  });

  if (!result.ok) return result;
  revalidatePurchaseViews(purchaseId, [result.orderId]);
  return { ok: true };
}

const refundSchema = z.object({
  quantity: z.number().int().positive('La cantidad debe ser mayor que 0'),
  amount: z.number().finite().nonnegative('El monto no puede ser negativo'),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
});

/** Reembolso acumulativo: reduce lo comprado y anota la línea. */
export async function refundBuyedProductAction(
  purchaseId: string,
  buyedProductId: string,
  quantity: number,
  amount: number,
  notes: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const pid = parseId(purchaseId);
  const rowId = parseId(buyedProductId);
  if (!pid || !rowId) return { ok: false, error: 'Identificador inválido' };

  const parsed = refundSchema.safeParse({ quantity, amount, notes });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos de reembolso inválidos',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.productBuyed.findUnique({
      where: { id: rowId },
      select: {
        shopingReceipId: true,
        originalProductId: true,
        amountBuyed: true,
        quantityRefuned: true,
        refundNotes: true,
        originalProduct: {
          select: {
            name: true,
            amountPurchased: true,
            amountReceived: true,
            orderId: true,
          },
        },
      },
    });
    if (!row || row.shopingReceipId !== pid) {
      return { ok: false as const, error: 'El producto no pertenece a esta compra' };
    }
    const blocked = canRefund(row.originalProduct, row, d.quantity);
    if (blocked) return { ok: false as const, error: blocked };
    const note = appendRefundNote(
      row.refundNotes,
      d.notes,
      d.quantity,
      d.amount,
      new Date()
    );
    if (!note.ok) return { ok: false as const, error: note.error };

    const newRefunded = row.quantityRefuned + d.quantity;
    await tx.productBuyed.update({
      where: { id: rowId },
      data: {
        quantityRefuned: newRefunded,
        refundAmount: { increment: round2(d.amount) },
        refundNotes: note.value,
        isRefunded: newRefunded >= row.amountBuyed,
        refundDate: new Date(),
      },
    });
    await recomputeProductAmounts(row.originalProductId, tx);
    return { ok: true as const, orderId: row.originalProduct.orderId.toString() };
  });

  if (!result.ok) return result;
  revalidatePurchaseViews(purchaseId, [result.orderId]);
  return { ok: true };
}

/**
 * Borrar una compra borra sus productos comprados explícitamente (las
 * FK de la BD de Django no tienen cascada) y recalcula cada producto;
 * se bloquea si alguna unidad ya fue recibida.
 */
export async function deletePurchaseAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.shoppingReceip.findUnique({
      where: { id: pid },
      select: {
        buyedProducts: {
          select: {
            id: true,
            amountBuyed: true,
            quantityRefuned: true,
            originalProductId: true,
            originalProduct: {
              select: {
                name: true,
                amountPurchased: true,
                amountReceived: true,
                orderId: true,
              },
            },
          },
        },
      },
    });
    if (!purchase) return { ok: false as const, error: 'Compra no encontrada' };

    // Varias filas del mismo producto se evalúan acumuladas.
    const perProduct = new Map<
      string,
      { name: string; amountPurchased: number; amountReceived: number; effective: number; orderId: string }
    >();
    for (const row of purchase.buyedProducts) {
      const entry = perProduct.get(row.originalProductId) ?? {
        ...row.originalProduct,
        orderId: row.originalProduct.orderId.toString(),
        effective: 0,
      };
      entry.effective += Math.max(0, row.amountBuyed - row.quantityRefuned);
      perProduct.set(row.originalProductId, entry);
    }
    for (const p of perProduct.values()) {
      const blocked = canRemoveBuyed(p, {
        amountBuyed: p.effective,
        quantityRefuned: 0,
      });
      if (blocked) return { ok: false as const, error: blocked };
    }

    await tx.productBuyed.deleteMany({ where: { shopingReceipId: pid } });
    await tx.shoppingReceip.delete({ where: { id: pid } });
    for (const productId of perProduct.keys()) {
      await recomputeProductAmounts(productId, tx);
    }
    return {
      ok: true as const,
      orderIds: [...new Set([...perProduct.values()].map((p) => p.orderId))],
    };
  }, TX_OPTIONS);

  if (!result.ok) return result;
  revalidatePurchaseViews(undefined, result.orderIds);
  return { ok: true };
}
