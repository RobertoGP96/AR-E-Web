'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { expenseFormSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type SessionUser = {
  id: string;
  role: string;
  phoneNumber: string;
  name: string;
};

async function requireAdminLikeRole(): Promise<
  { denied: ActionResult } | { user: SessionUser }
> {
  const session = await auth();
  if (!session?.user) {
    return { denied: { ok: false, error: 'Not authenticated' } };
  }
  const allowed = new Set(['admin', 'agent', 'accountant', 'logistical']);
  if (!allowed.has(session.user.role)) {
    return { denied: { ok: false, error: 'Forbidden' } };
  }
  return { user: session.user };
}

function flattenZodErrors(
  result: ReturnType<typeof expenseFormSchema.safeParse>
): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createExpenseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdminLikeRole();
  if ('denied' in guard) return guard.denied;

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
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  await prisma.expense.create({
    data: {
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description,
      createdById: BigInt(guard.user.id),
    },
  });

  revalidatePath('/expenses');
  return { ok: true };
}

export async function updateExpenseAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdminLikeRole();
  if ('denied' in guard) return guard.denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

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
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.expense.update({
      where: { id: BigInt(idRaw) },
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
  const guard = await requireAdminLikeRole();
  if ('denied' in guard) return guard.denied;

  try {
    await prisma.expense.delete({ where: { id: BigInt(id) } });
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
