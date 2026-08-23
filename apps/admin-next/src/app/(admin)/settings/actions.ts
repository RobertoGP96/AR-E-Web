'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  requireRole,
  zodFieldErrors,
  ROLES,
} from '@/lib/action-helpers';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

const schema = z.object({
  changeRate: z.coerce.number().min(0, 'Must be ≥ 0'),
  costPerPound: z.coerce.number().min(0, 'Must be ≥ 0'),
});

export async function updateCommonInfoAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = schema.safeParse({
    changeRate: formData.get('changeRate'),
    costPerPound: formData.get('costPerPound'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  // CommonInformation is a singleton (Django get_instance()): update the
  // first row, or create it if none exists.
  const existing = await prisma.commonInformation.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.commonInformation.update({
      where: { id: existing.id },
      data: {
        changeRate: parsed.data.changeRate,
        costPerPound: parsed.data.costPerPound,
      },
    });
  } else {
    await prisma.commonInformation.create({
      data: {
        changeRate: parsed.data.changeRate,
        costPerPound: parsed.data.costPerPound,
      },
    });
  }

  revalidatePath('/settings');
  return { ok: true };
}
