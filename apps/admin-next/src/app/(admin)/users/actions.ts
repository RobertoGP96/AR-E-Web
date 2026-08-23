'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashDjangoPassword } from '@/lib/password';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  createUserSchema,
  editUserSchema,
  changePasswordSchema,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

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
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const parsed = createUserSchema.safeParse({
    ...readForm(formData),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
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
          ? parseId(d.assignedAgentId)
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
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const userId = parseId(formData.get('id'));
  if (!userId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = editUserSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  try {
    await prisma.customUser.update({
      where: { id: userId },
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
          ? parseId(d.assignedAgentId)
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
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const userId = parseId(formData.get('id'));
  if (!userId) return { ok: false, error: 'Missing or invalid id' };

  const parsed = changePasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.customUser.update({
      where: { id: userId },
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
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const userId = parseId(id);
  if (!userId) return { ok: false, error: 'Invalid user id' };

  try {
    await prisma.customUser.update({
      where: { id: userId },
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
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const userId = parseId(id);
  if (!userId) return { ok: false, error: 'Invalid user id' };

  try {
    await prisma.customUser.update({
      where: { id: userId },
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
  const { denied, user } = await requireRole(ROLES.users);
  if (denied) return denied;
  if (user.id === id) {
    return { ok: false, error: 'You cannot delete your own account' };
  }

  const userId = parseId(id);
  if (!userId) return { ok: false, error: 'Invalid user id' };

  try {
    await prisma.customUser.delete({ where: { id: userId } });
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
