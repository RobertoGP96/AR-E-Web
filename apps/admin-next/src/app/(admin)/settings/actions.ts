'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  changeRate: z.coerce.number().min(0, 'Must be ≥ 0'),
  costPerPound: z.coerce.number().min(0, 'Must be ≥ 0'),
});

export async function updateCommonInfoAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  if (!['admin', 'accountant'].includes(session.user.role)) {
    return { ok: false, error: 'Only admin/accountant can change settings' };
  }

  const parsed = schema.safeParse({
    changeRate: formData.get('changeRate'),
    costPerPound: formData.get('costPerPound'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.map(String).join('.');
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: 'Validation failed', fieldErrors };
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
