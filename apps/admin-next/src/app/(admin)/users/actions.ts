'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hashDjangoPassword } from '@/lib/password';
import {
  createUserSchema,
  editUserSchema,
  changePasswordSchema,
} from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Managing users (incl. roles) is admin-only in this app. */
async function requireAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  if (session.user.role !== 'admin') {
    return { ok: false, error: 'Only admins can manage users' };
  }
  return null;
}

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

function uniqueError(
  err: Prisma.PrismaClientKnownRequestError
): ActionResult | null {
  if (err.code !== 'P2002') return null;
  const target = err.meta?.target;
  const fields = Array.isArray(target) ? target : [];
  if (fields.includes('email')) {
    return {
      ok: false,
      error: 'Email already in use',
      fieldErrors: { email: 'Already in use' },
    };
  }
  if (fields.includes('phone_number')) {
    return {
      ok: false,
      error: 'Phone number already in use',
      fieldErrors: { phoneNumber: 'Already in use' },
    };
  }
  return { ok: false, error: 'Duplicate value' };
}

function readForm(formData: FormData) {
  return {
    name: formData.get('name'),
    lastName: formData.get('lastName'),
    phoneNumber: formData.get('phoneNumber'),
    email: formData.get('email') ?? '',
    homeAddress: formData.get('homeAddress') ?? '',
    role: formData.get('role'),
    agentProfit: formData.get('agentProfit') ?? 0,
    balance: formData.get('balance') ?? 0,
    assignedAgentId: formData.get('assignedAgentId') ?? '',
    isActive: formData.get('isActive'),
  };
}

export async function createUserAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = createUserSchema.safeParse({
    ...readForm(formData),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  try {
    await prisma.customUser.create({
      data: {
        name: d.name,
        lastName: d.lastName,
        phoneNumber: d.phoneNumber,
        email: d.email,
        homeAddress: d.homeAddress,
        role: d.role,
        agentProfit: d.agentProfit,
        balance: d.balance,
        isActive: d.isActive,
        password: hashDjangoPassword(d.password),
        assignedAgentId: d.assignedAgentId
          ? BigInt(d.assignedAgentId)
          : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const u = uniqueError(err);
      if (u) return u;
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function updateUserAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

  const parsed = editUserSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  try {
    await prisma.customUser.update({
      where: { id: BigInt(idRaw) },
      data: {
        name: d.name,
        lastName: d.lastName,
        phoneNumber: d.phoneNumber,
        email: d.email,
        homeAddress: d.homeAddress,
        role: d.role,
        agentProfit: d.agentProfit,
        balance: d.balance,
        isActive: d.isActive,
        assignedAgentId: d.assignedAgentId
          ? BigInt(d.assignedAgentId)
          : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const u = uniqueError(err);
      if (u) return u;
      if (err.code === 'P2025') return { ok: false, error: 'User not found' };
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function changePasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

  const parsed = changePasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
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
      where: { id: BigInt(idRaw) },
      data: { password: hashDjangoPassword(parsed.data.password) },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'User not found' };
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function toggleUserActiveAction(
  id: string,
  nextActive: boolean
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await prisma.customUser.update({
      where: { id: BigInt(id) },
      data: { isActive: nextActive },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'User not found' };
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function verifyUserAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await prisma.customUser.update({
      where: { id: BigInt(id) },
      data: { isVerified: true, isActive: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'User not found' };
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const guard = await auth();
  if (!guard?.user) return { ok: false, error: 'Not authenticated' };
  if (guard.user.role !== 'admin') {
    return { ok: false, error: 'Only admins can manage users' };
  }
  if (guard.user.id === id) {
    return { ok: false, error: 'You cannot delete your own account' };
  }

  try {
    await prisma.customUser.delete({ where: { id: BigInt(id) } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return { ok: false, error: 'User not found' };
      if (err.code === 'P2003') {
        return {
          ok: false,
          error: 'Cannot delete: user has linked orders, deliveries, or expenses',
        };
      }
    }
    throw err;
  }

  revalidatePath('/users');
  return { ok: true };
}
