'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { shopFormSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdminLikeRole(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  const allowed = new Set(['admin', 'agent', 'accountant', 'logistical']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function flattenZodErrors(
  result: ReturnType<typeof shopFormSchema.safeParse>
): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

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
  const denied = await requireAdminLikeRole();
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
      fieldErrors: flattenZodErrors(parsed),
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
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

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
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.shop.update({
      where: { id: BigInt(idRaw) },
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
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.shop.update({
      where: { id: BigInt(id) },
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
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.shop.delete({ where: { id: BigInt(id) } });
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
