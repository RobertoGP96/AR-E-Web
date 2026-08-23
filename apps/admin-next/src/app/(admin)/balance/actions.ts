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
import { balanceFormSchema } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const balanceId = parseId(formData.get('id'));
  if (!balanceId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.balance.update({
      where: { id: balanceId },
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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const balanceId = parseId(id);
  if (!balanceId) return { ok: false, error: 'Invalid balance id' };

  try {
    await prisma.balance.delete({ where: { id: balanceId } });
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
