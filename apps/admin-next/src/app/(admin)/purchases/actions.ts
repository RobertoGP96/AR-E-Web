'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { purchaseFormSchema, toDbPayStatus } from './schema';

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

  await prisma.shoppingReceip.create({
    data: {
      shopOfBuyId: BigInt(d.shopOfBuyId),
      shoppingAccountId: BigInt(d.shoppingAccountId),
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

  try {
    await prisma.shoppingReceip.update({
      where: { id: BigInt(idRaw) },
      data: {
        shopOfBuyId: BigInt(d.shopOfBuyId),
        shoppingAccountId: BigInt(d.shoppingAccountId),
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

export async function deletePurchaseAction(
  id: string
): Promise<ActionResult> {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    await prisma.shoppingReceip.delete({ where: { id: BigInt(id) } });
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
