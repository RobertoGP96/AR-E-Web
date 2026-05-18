'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { balanceFormSchema } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdminLikeRole(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  const allowed = new Set(['admin', 'accountant']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function flattenZodErrors(
  result: ReturnType<typeof balanceFormSchema.safeParse>
): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function parseFormData(formData: FormData) {
  return balanceFormSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    systemWeight: formData.get('systemWeight'),
    registeredWeight: formData.get('registeredWeight'),
    revenues: formData.get('revenues'),
    buysCosts: formData.get('buysCosts'),
    costs: formData.get('costs'),
    expenses: formData.get('expenses'),
    notes: formData.get('notes') ?? '',
  });
}

export async function createBalanceAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  await prisma.balance.create({
    data: {
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      systemWeight: parsed.data.systemWeight,
      registeredWeight: parsed.data.registeredWeight,
      revenues: parsed.data.revenues,
      buysCosts: parsed.data.buysCosts,
      costs: parsed.data.costs,
      expenses: parsed.data.expenses,
      notes: parsed.data.notes,
    },
  });

  revalidatePath('/balance');
  return { ok: true };
}

export async function updateBalanceAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.balance.update({
      where: { id: BigInt(idRaw) },
      data: {
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        systemWeight: parsed.data.systemWeight,
        registeredWeight: parsed.data.registeredWeight,
        revenues: parsed.data.revenues,
        buysCosts: parsed.data.buysCosts,
        costs: parsed.data.costs,
        expenses: parsed.data.expenses,
        notes: parsed.data.notes,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Balance not found' };
    }
    throw err;
  }

  revalidatePath('/balance');
  return { ok: true };
}

export async function deleteBalanceAction(id: string): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.balance.delete({ where: { id: BigInt(id) } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Balance not found' };
    }
    throw err;
  }

  revalidatePath('/balance');
  return { ok: true };
}
