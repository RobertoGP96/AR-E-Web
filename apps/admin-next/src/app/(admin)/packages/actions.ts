'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  packageFormSchema,
  arrivalBatchSchema,
  PACKAGE_STATUSES,
} from './schema';
import type { ArrivalBatchInput, PackageStatus } from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

export async function createPackageAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
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
      fieldErrors: zodFieldErrors(parsed.error.issues),
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
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const id = parseId(formData.get('id'));
  if (!id) return { ok: false, error: 'Missing or invalid id' };

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
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  try {
    await prisma.package.update({
      where: { id },
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
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Invalid package id' };

  if (!PACKAGE_STATUSES.includes(nextStatus)) {
    return { ok: false, error: 'Invalid status' };
  }

  try {
    await prisma.package.update({
      where: { id: pid },
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
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Invalid package id' };

  try {
    await prisma.package.delete({ where: { id: pid } });
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

/**
 * Lote de /delivery/prepare (fase «Revisar paquetes»): registra de una
 * vez todas las llegadas marcadas en un paquete (N filas de
 * ProductReceived) y opcionalmente deja el paquete en otro estado
 * (Enviado → Recibido al marcar la primera llegada). Transaccional: si
 * algún producto ya no tiene unidades compradas pendientes de recibir
 * (otra sesión se adelantó), no se registra nada.
 */
export async function registerArrivalsAction(
  input: ArrivalBatchInput
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const parsed = arrivalBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }
  const d = parsed.data;
  const pid = parseId(d.packageId);
  if (!pid) return { ok: false, error: 'Invalid package id' };
  const productIds = d.items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const pkg = await tx.package.findUnique({
        where: { id: pid },
        select: { id: true },
      });
      if (!pkg) return { ok: false as const, error: 'Paquete no encontrado' };

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          amountPurchased: true,
          amountReceived: true,
        },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const item of d.items) {
        const p = byId.get(item.productId);
        if (!p) return { ok: false as const, error: 'Producto no encontrado' };
        const remaining = p.amountPurchased - p.amountReceived;
        if (item.amount > remaining) {
          return {
            ok: false as const,
            error: `Solo quedan ${Math.max(0, remaining)} unidad(es) de «${p.name}» compradas sin recibir`,
          };
        }
      }

      await tx.productReceived.createMany({
        data: d.items.map((i) => ({
          packageId: pid,
          originalProductId: i.productId,
          amountReceived: i.amount,
          observation: i.observation ?? null,
        })),
      });
      for (const item of d.items) {
        await recomputeProductAmounts(item.productId, tx);
      }
      if (d.setStatus) {
        await tx.package.update({
          where: { id: pid },
          data: { statusOfProcessing: d.setStatus },
        });
      }
      return { ok: true as const };
    },
    // Un lote grande recalcula muchos productos sobre el driver de
    // Neon; el timeout por defecto (5 s) se queda corto.
    { timeout: 60_000, maxWait: 10_000 }
  );

  if (!result.ok) return result;

  revalidatePath('/packages');
  revalidatePath(`/packages/${d.packageId}`);
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return { ok: true };
}

/**
 * Product reception: registering a ProductReceived row is what moves a
 * product from "Comprado" to "Recibido" (via recomputeProductAmounts)
 * and makes it a candidate for deliveries. Mirrors the Django flow the
 * Vite admin drives through /packages/:id/manage-products.
 */
export async function addReceivedProductAction(
  packageId: string,
  productId: string,
  amount: number,
  observation?: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(packageId);
  if (!pid) return { ok: false, error: 'Invalid package id' };
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'Amount must be a positive integer' };
  }
  const note = (observation ?? '').trim();
  if (note.length > 200) {
    return { ok: false, error: 'Observation must be 200 characters or fewer' };
  }

  const [pkg, product] = await Promise.all([
    prisma.package.findUnique({ where: { id: pid }, select: { id: true } }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { amountPurchased: true, amountReceived: true, name: true },
    }),
  ]);
  if (!pkg) return { ok: false, error: 'Package not found' };
  if (!product) return { ok: false, error: 'Product not found' };

  const remaining = product.amountPurchased - product.amountReceived;
  if (amount > remaining) {
    return {
      ok: false,
      error: `Only ${Math.max(0, remaining)} unit(s) of "${product.name}" are purchased but not yet received`,
    };
  }

  await prisma.productReceived.create({
    data: {
      packageId: pid,
      originalProductId: productId,
      amountReceived: amount,
      observation: note || null,
    },
  });
  await recomputeProductAmounts(productId);

  revalidatePath(`/packages/${packageId}`);
  revalidatePath('/packages');
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return { ok: true };
}

export async function removeReceivedProductAction(
  packageId: string,
  productReceivedId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const rowId = parseId(productReceivedId);
  if (!rowId) return { ok: false, error: 'Invalid row id' };

  const row = await prisma.productReceived.findUnique({
    where: { id: rowId },
    select: { originalProductId: true },
  });
  if (!row) return { ok: false, error: 'Received product not found' };

  await prisma.productReceived.delete({ where: { id: rowId } });
  await recomputeProductAmounts(row.originalProductId);

  revalidatePath(`/packages/${packageId}`);
  revalidatePath('/packages');
  revalidatePath('/delivery/prepare');
  revalidatePath('/orders');
  revalidatePath('/products');
  return { ok: true };
}
