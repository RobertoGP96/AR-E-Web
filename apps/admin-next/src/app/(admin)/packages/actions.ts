'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { packageFormSchema, PACKAGE_STATUSES } from './schema';
import type { PackageStatus } from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdminLikeRole(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  const allowed = new Set(['admin', 'agent', 'accountant', 'logistical']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function flattenZodErrors(
  result: ReturnType<typeof packageFormSchema.safeParse>
): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createPackageAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const parsed = packageFormSchema.safeParse({
    agencyName: formData.get('agencyName'),
    numberOfTracking: formData.get('numberOfTracking'),
    statusOfProcessing: formData.get('statusOfProcessing'),
    arrivalDate: formData.get('arrivalDate'),
    packagePicture: formData.get('packagePicture') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.package.create({
      data: {
        agencyName: parsed.data.agencyName,
        numberOfTracking: parsed.data.numberOfTracking,
        statusOfProcessing: parsed.data.statusOfProcessing,
        arrivalDate: new Date(parsed.data.arrivalDate),
        packagePicture: parsed.data.packagePicture,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: false,
        error: 'A package with that tracking number already exists',
        fieldErrors: { numberOfTracking: 'Already exists' },
      };
    }
    throw err;
  }

  revalidatePath('/packages');
  return { ok: true };
}

export async function updatePackageAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const idRaw = formData.get('id');
  if (typeof idRaw !== 'string' || !idRaw) {
    return { ok: false, error: 'Missing id' };
  }

  const parsed = packageFormSchema.safeParse({
    agencyName: formData.get('agencyName'),
    numberOfTracking: formData.get('numberOfTracking'),
    statusOfProcessing: formData.get('statusOfProcessing'),
    arrivalDate: formData.get('arrivalDate'),
    packagePicture: formData.get('packagePicture') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  try {
    await prisma.package.update({
      where: { id: BigInt(idRaw) },
      data: {
        agencyName: parsed.data.agencyName,
        numberOfTracking: parsed.data.numberOfTracking,
        statusOfProcessing: parsed.data.statusOfProcessing,
        arrivalDate: new Date(parsed.data.arrivalDate),
        packagePicture: parsed.data.packagePicture,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return {
          ok: false,
          error: 'Another package already has that tracking number',
          fieldErrors: { numberOfTracking: 'Already in use' },
        };
      }
      if (err.code === 'P2025') {
        return { ok: false, error: 'Package not found' };
      }
    }
    throw err;
  }

  revalidatePath('/packages');
  return { ok: true };
}

export async function setPackageStatusAction(
  id: string,
  nextStatus: PackageStatus
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  if (!PACKAGE_STATUSES.includes(nextStatus)) {
    return { ok: false, error: 'Invalid status' };
  }

  try {
    await prisma.package.update({
      where: { id: BigInt(id) },
      data: { statusOfProcessing: nextStatus },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Package not found' };
    }
    throw err;
  }

  revalidatePath('/packages');
  return { ok: true };
}

export async function deletePackageAction(id: string): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.package.delete({ where: { id: BigInt(id) } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return { ok: false, error: 'Package not found' };
      if (err.code === 'P2003') {
        return {
          ok: false,
          error: 'Cannot delete: package has received products linked to it',
        };
      }
    }
    throw err;
  }

  revalidatePath('/packages');
  return { ok: true };
}
