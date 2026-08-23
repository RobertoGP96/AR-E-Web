'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import { purchaseFormSchema, toDbPayStatus } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

function parse(formData: FormData) {
  return purchaseFormSchema.safeParse({
    shopOfBuyId: formData.get('shopOfBuyId'),
    shoppingAccountId: formData.get('shoppingAccountId'),
    statusOfShopping: formData.get('statusOfShopping'),
    cardId: formData.get('cardId') ?? '',
    buyDate: formData.get('buyDate'),
    totalCostOfPurchase: formData.get('totalCostOfPurchase') ?? 0,
  });
}

export async function createPurchaseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
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
  const shopOfBuyId = parseId(d.shopOfBuyId);
  const shoppingAccountId = parseId(d.shoppingAccountId);
  if (!shopOfBuyId || !shoppingAccountId) {
    return { ok: false, error: 'Invalid shop or account id' };
  }

  await prisma.shoppingReceip.create({
    data: {
      shopOfBuyId,
      shoppingAccountId,
      statusOfShopping: toDbPayStatus(d.statusOfShopping),
      cardId: d.cardId,
      buyDate: new Date(d.buyDate),
      totalCostOfPurchase: d.totalCostOfPurchase,
    },
  });

  revalidatePath('/purchases');
  return { ok: true };
}

export async function updatePurchaseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
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
  const shopOfBuyId = parseId(d.shopOfBuyId);
  const shoppingAccountId = parseId(d.shoppingAccountId);
  if (!shopOfBuyId || !shoppingAccountId) {
    return { ok: false, error: 'Invalid shop or account id' };
  }

  try {
    await prisma.shoppingReceip.update({
      where: { id },
      data: {
        shopOfBuyId,
        shoppingAccountId,
        statusOfShopping: toDbPayStatus(d.statusOfShopping),
        cardId: d.cardId,
        buyDate: new Date(d.buyDate),
        totalCostOfPurchase: d.totalCostOfPurchase,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Purchase not found' };
    }
    throw err;
  }

  revalidatePath('/purchases');
  return { ok: true };
}

export async function addBuyedProductAction(
  purchaseId: string,
  productId: string,
  amount: number
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const pid = parseId(purchaseId);
  if (!pid) return { ok: false, error: 'Invalid purchase id' };
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'Amount must be a positive integer' };
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { amountRequested: true, amountPurchased: true, name: true },
  });
  if (!product) return { ok: false, error: 'Product not found' };

  const remaining = product.amountRequested - product.amountPurchased;
  if (amount > remaining) {
    return {
      ok: false,
      error: `Only ${Math.max(0, remaining)} unit(s) of "${product.name}" are requested but not yet purchased`,
    };
  }

  await prisma.productBuyed.create({
    data: {
      shopingReceipId: pid,
      originalProductId: productId,
      amountBuyed: amount,
    },
  });
  await recomputeProductAmounts(productId);

  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath('/orders');
  return { ok: true };
}

export async function removeBuyedProductAction(
  purchaseId: string,
  buyedProductId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const rowId = parseId(buyedProductId);
  if (!rowId) return { ok: false, error: 'Invalid row id' };

  const row = await prisma.productBuyed.findUnique({
    where: { id: rowId },
    select: { originalProductId: true },
  });
  if (!row) return { ok: false, error: 'Bought product not found' };

  await prisma.productBuyed.delete({ where: { id: rowId } });
  await recomputeProductAmounts(row.originalProductId);

  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath('/orders');
  return { ok: true };
}

const refundSchema = z.object({
  quantity: z.number().int().positive(),
  amount: z.number().finite().nonnegative(),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or fewer'),
});

export async function refundBuyedProductAction(
  purchaseId: string,
  buyedProductId: string,
  quantity: number,
  amount: number,
  notes: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const rowId = parseId(buyedProductId);
  if (!rowId) return { ok: false, error: 'Invalid row id' };

  const parsed = refundSchema.safeParse({ quantity, amount, notes });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? 'Invalid refund data',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const row = await prisma.productBuyed.findUnique({
    where: { id: rowId },
    select: {
      originalProductId: true,
      amountBuyed: true,
      quantityRefuned: true,
    },
  });
  if (!row) return { ok: false, error: 'Bought product not found' };

  // Refunds accumulate: a second partial refund adds to the first.
  const refundable = row.amountBuyed - row.quantityRefuned;
  if (d.quantity > refundable) {
    return {
      ok: false,
      error: `Only ${Math.max(0, refundable)} unit(s) left to refund (${row.quantityRefuned} of ${row.amountBuyed} already refunded)`,
    };
  }
  const newRefunded = row.quantityRefuned + d.quantity;

  await prisma.productBuyed.update({
    where: { id: rowId },
    data: {
      quantityRefuned: newRefunded,
      refundAmount: { increment: d.amount },
      refundNotes: d.notes || null,
      isRefunded: newRefunded >= row.amountBuyed,
      refundDate: new Date(),
    },
  });
  await recomputeProductAmounts(row.originalProductId);

  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath('/orders');
  return { ok: true };
}

export async function deletePurchaseAction(
  id: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.purchases);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Invalid purchase id' };

  try {
    await prisma.shoppingReceip.delete({ where: { id: pid } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return { ok: false, error: 'Purchase not found' };
      }
      if (err.code === 'P2003') {
        return {
          ok: false,
          error: 'Cannot delete: purchase has linked bought products',
        };
      }
    }
    throw err;
  }

  revalidatePath('/purchases');
  return { ok: true };
}
