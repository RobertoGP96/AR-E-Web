'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hashDjangoPassword, verifyDjangoPassword } from '@/lib/password';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Min 2 characters').max(100),
  lastName: z.string().trim().min(2, 'Min 2 characters').max(100),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email'
    ),
  homeAddress: z.string().trim().max(200).optional().default(''),
});

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Required'),
    next: z.string().min(6, 'Min 6 characters'),
    confirm: z.string().min(6, 'Min 6 characters'),
  })
  .refine((d) => d.next === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

function zErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function updateProfileAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    lastName: formData.get('lastName'),
    email: formData.get('email') ?? '',
    homeAddress: formData.get('homeAddress') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.customUser.update({
      where: { id: BigInt(session.user.id) },
      data: {
        name: parsed.data.name,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        homeAddress: parsed.data.homeAddress,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: false,
        error: 'Email already in use',
        fieldErrors: { email: 'Already in use' },
      };
    }
    throw err;
  }

  revalidatePath('/profile');
  return { ok: true };
}

export async function changeOwnPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const parsed = passwordSchema.safeParse({
    current: formData.get('current'),
    next: formData.get('next'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }

  const user = await prisma.customUser.findUnique({
    where: { id: BigInt(session.user.id) },
    select: { password: true },
  });
  if (!user) return { ok: false, error: 'User not found' };

  if (!verifyDjangoPassword(parsed.data.current, user.password)) {
    return {
      ok: false,
      error: 'Current password is incorrect',
      fieldErrors: { current: 'Incorrect' },
    };
  }

  await prisma.customUser.update({
    where: { id: BigInt(session.user.id) },
    data: { password: hashDjangoPassword(parsed.data.next) },
  });

  return { ok: true };
}
