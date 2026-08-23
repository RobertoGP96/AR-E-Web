'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import { shopFormSchema } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

function translateUniqueError(
  err: Prisma.PrismaClientKnownRequestError
): ActionResult | null {
  if (err.code !== 'P2002') return null;
  const target = err.meta?.target;
  const fields = Array.isArray(target)
    ? target
    : typeof target === 'string'
      ? [target]
      : [];
  if (fields.includes('name')) {
    return {
      ok: false,
      error: 'A shop with that name already exists',
      fieldErrors: { name: 'Already exists' },
    };
  }
  if (fields.includes('link')) {
    return {
      ok: false,
      error: 'A shop with that link already exists',
      fieldErrors: { link: 'Already exists' },
    };
  }
  return { ok: false, error: 'Duplicate value' };
}

export async function createShopAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.shops);
  if (denied) return denied;

  const parsed = shopFormSchema.safeParse({
    name: formData.get('name'),
    link: formData.get('link'),
    taxRate: formData.get('taxRate'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.shop.create({
      data: {
        name: parsed.data.name,
        link: parsed.data.link,
        taxRate: parsed.data.taxRate,
        isActive: parsed.data.isActive,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const translated = translateUniqueError(err);
      if (translated) return translated;
    }
    throw err;
  }

  revalidatePath('/shops');
  return { ok: true };
}

export async function updateShopAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.shops);
  if (denied) return denied;

  const shopId = parseId(formData.get('id'));
  if (!shopId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = shopFormSchema.safeParse({
    name: formData.get('name'),
    link: formData.get('link'),
    taxRate: formData.get('taxRate'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: parsed.data.name,
        link: parsed.data.link,
        taxRate: parsed.data.taxRate,
        isActive: parsed.data.isActive,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const translated = translateUniqueError(err);
      if (translated) return translated;
      if (err.code === 'P2025') return { ok: false, error: 'Shop not found' };
    }
    throw err;
  }

  revalidatePath('/shops');
  return { ok: true };
}

export async function toggleShopActiveAction(
  id: string,
  nextActive: boolean
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.shops);
  if (denied) return denied;

  const shopId = parseId(id);
  if (!shopId) return { ok: false, error: 'Invalid shop id' };

  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: nextActive },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Shop not found' };
    }
    throw err;
  }

  revalidatePath('/shops');
  return { ok: true };
}

export async function deleteShopAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.shops);
  if (denied) return denied;

  const shopId = parseId(id);
  if (!shopId) return { ok: false, error: 'Invalid shop id' };

  try {
    await prisma.shop.delete({ where: { id: shopId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return { ok: false, error: 'Shop not found' };
      if (err.code === 'P2003') {
        return {
          ok: false,
          error:
            'Cannot delete: shop has linked products, accounts, or receipts',
        };
      }
    }
    throw err;
  }

  revalidatePath('/shops');
  return { ok: true };
}
