'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { categoryFormSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdminLikeRole(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Not authenticated' };
  }
  const allowed = new Set(['admin', 'agent', 'accountant', 'logistical']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function flattenZodErrors(
  error: ReturnType<typeof categoryFormSchema.safeParse>
): Record<string, string> {
  if (error.success) return {};
  const out: Record<string, string> = {};
  for (const issue of error.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createCategoryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const parsed = categoryFormSchema.safeParse({
    name: formData.get('name'),
    shippingCostPerPound: formData.get('shippingCostPerPound'),
    clientShippingCharge: formData.get('clientShippingCharge'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.category.create({
      data: {
        name: parsed.data.name,
        shippingCostPerPound: parsed.data.shippingCostPerPound,
        clientShippingCharge: parsed.data.clientShippingCharge,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: false,
        error: 'A category with that name already exists',
        fieldErrors: { name: 'Already exists' },
      };
    }
    throw err;
  }

  revalidatePath('/categories');
  return { ok: true };
}

export async function updateCategoryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

  const parsed = categoryFormSchema.safeParse({
    name: formData.get('name'),
    shippingCostPerPound: formData.get('shippingCostPerPound'),
    clientShippingCharge: formData.get('clientShippingCharge'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.category.update({
      where: { id: BigInt(idRaw) },
      data: {
        name: parsed.data.name,
        shippingCostPerPound: parsed.data.shippingCostPerPound,
        clientShippingCharge: parsed.data.clientShippingCharge,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return {
          ok: false,
          error: 'Another category already has that name',
          fieldErrors: { name: 'Already in use' },
        };
      }
      if (err.code === 'P2025') {
        return { ok: false, error: 'Category not found' };
      }
    }
    throw err;
  }

  revalidatePath('/categories');
  return { ok: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.category.delete({ where: { id: BigInt(id) } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Category not found' };
    }
    throw err;
  }

  revalidatePath('/categories');
  return { ok: true };
}
