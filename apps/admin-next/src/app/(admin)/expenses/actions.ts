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
import { expenseFormSchema } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

export async function createExpenseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = expenseFormSchema.safeParse({
    date: formData.get('date'),
    amount: formData.get('amount'),
    category: formData.get('category'),
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  await prisma.expense.create({
    data: {
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description,
      createdById: parseId(user.id),
    },
  });

  revalidatePath('/expenses');
  return { ok: true };
}

export async function updateExpenseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const expenseId = parseId(formData.get('id'));
  if (!expenseId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = expenseFormSchema.safeParse({
    date: formData.get('date'),
    amount: formData.get('amount'),
    category: formData.get('category'),
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        date: new Date(parsed.data.date),
        amount: parsed.data.amount,
        category: parsed.data.category,
        description: parsed.data.description,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Expense not found' };
    }
    throw err;
  }

  revalidatePath('/expenses');
  return { ok: true };
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const expenseId = parseId(id);
  if (!expenseId) return { ok: false, error: 'Invalid expense id' };

  try {
    await prisma.expense.delete({ where: { id: expenseId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Expense not found' };
    }
    throw err;
  }

  revalidatePath('/expenses');
  return { ok: true };
}
