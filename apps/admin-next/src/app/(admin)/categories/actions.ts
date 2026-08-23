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
import { categoryFormSchema } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

export async function createCategoryAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.categories);
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
      fieldErrors: zodFieldErrors(parsed.error.issues),
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
  const { denied } = await requireRole(ROLES.categories);
  if (denied) return denied;

  const categoryId = parseId(formData.get('id'));
  if (!categoryId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = categoryFormSchema.safeParse({
    name: formData.get('name'),
    shippingCostPerPound: formData.get('shippingCostPerPound'),
    clientShippingCharge: formData.get('clientShippingCharge'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
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
  const { denied } = await requireRole(ROLES.categories);
  if (denied) return denied;

  const categoryId = parseId(id);
  if (!categoryId) return { ok: false, error: 'Invalid category id' };

  try {
    await prisma.category.delete({ where: { id: categoryId } });
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
