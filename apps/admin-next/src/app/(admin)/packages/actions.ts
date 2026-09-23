'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recomputeProductAmounts } from '@/lib/product-status';
import {
  addUnitsToOpenBag,
  countUnitsInOpenBags,
  pullUnitsFromOpenBags,
} from '@/lib/open-bags';
import {
  nextPackageStatus,
  type PackageAction,
} from '@/lib/package-status';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  packageFormSchema,
  packageStatusSchema,
  arrivalBatchSchema,
  packageWithArrivalsSchema,
} from './schema';
import type { ArrivalBatchInput, PackageWithArrivalsInput } from './schema';
import type { BagSummary } from '@/lib/open-bags';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/** Resultado de registrar llegadas: a qué bolsas cayeron las unidades. */
export type ArrivalsResult = ActionResult & { bags?: BagSummary[] };

function parseForm(formData: FormData) {
  return packageFormSchema.safeParse({
    agencyName: formData.get('agencyName'),
    numberOfTracking: formData.get('numberOfTracking'),
    arrivalDate: formData.get('arrivalDate'),
    packagePicture: formData.get('packagePicture') ?? '',
    packagePicture2: formData.get('packagePicture2') ?? '',
    alreadyArrived: formData.get('alreadyArrived'),
  });
}

function revalidateReceptionViews(packageId?: string) {
  revalidatePath('/packages');
  if (packageId) revalidatePath(`/packages/${packageId}`);
  revalidatePath('/delivery/prepare');
  revalidatePath('/delivery');
  revalidatePath('/orders');
  revalidatePath('/products');
}

/** Crea el paquete en «Enviado» (o «Recibido» si ya está en el almacén). */
export async function createPackageAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  let id: bigint;
  try {
    const created = await prisma.package.create({
      data: {
        agencyName: d.agencyName,
        numberOfTracking: d.numberOfTracking,
        statusOfProcessing: d.alreadyArrived ? 'Recibido' : 'Enviado',
        arrivalDate: new Date(d.arrivalDate),
        packagePicture: d.packagePicture,
        packagePicture2: d.packagePicture2,
      },
      select: { id: true },
    });
    id = created.id;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: false,
        error: 'Ya existe un paquete con ese número de tracking',
        fieldErrors: { numberOfTracking: 'Ya existe' },
      };
    }
    throw err;
  }

  revalidatePath('/packages');
  revalidatePath('/delivery/prepare');
  return { ok: true, id: id.toString() };
}

/**
 * Edita la cabecera. El estado solo lo puede corregir un admin (campo
 * opcional `statusOfProcessing`); para el resto de roles se ignora.
 */
export async function updatePackageAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const id = parseId(formData.get('id'));
  if (!id) return { ok: false, error: 'Identificador inválido' };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  let status: string | undefined;
  const rawStatus = formData.get('statusOfProcessing');
  if (rawStatus !== null && rawStatus !== '') {
    const s = packageStatusSchema.safeParse(rawStatus);
    if (!s.success) return { ok: false, error: 'Estado inválido' };
    if (user.role !== 'admin') {
      return { ok: false, error: 'Solo un administrador puede corregir el estado' };
    }
    status = s.data;
  }

  try {
    await prisma.package.update({
      where: { id },
      data: {
        agencyName: d.agencyName,
        numberOfTracking: d.numberOfTracking,
        arrivalDate: new Date(d.arrivalDate),
        packagePicture: d.packagePicture,
        packagePicture2: d.packagePicture2,
        ...(status && { statusOfProcessing: status }),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return {
          ok: false,
          error: 'Otro paquete ya tiene ese número de tracking',
          fieldErrors: { numberOfTracking: 'Ya en uso' },
        };
      }
      if (err.code === 'P2025') {
        return { ok: false, error: 'Paquete no encontrado' };
      }
    }
    throw err;
  }

  revalidatePath('/packages');
  revalidatePath(`/packages/${id}`);
  revalidatePath('/delivery/prepare');
  return { ok: true };
}

/** Transición explícita de estado (INV-006): terminar revisión / reabrir. */
export async function transitionPackageStatusAction(
  id: string,
  action: PackageAction
): Promise<ActionResult> {
  const { denied, user } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const pkg = await tx.package.findUnique({
      where: { id: pid },
      select: { statusOfProcessing: true },
    });
    if (!pkg) return { ok: false as const, error: 'Paquete no encontrado' };
    const next = nextPackageStatus(pkg.statusOfProcessing, action, user.role);
    if (!next.ok) return next;
    await tx.package.update({
      where: { id: pid },
      data: { statusOfProcessing: next.to },
    });
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidatePath('/packages');
  revalidatePath(`/packages/${id}`);
  revalidatePath('/delivery/prepare');
  return { ok: true };
}

/**
 * Borrar un paquete solo sin recepciones (las FK de la BD no tienen
 * cascada y una recepción borrada a ciegas dejaría bolsas inconsistentes).
 */
export async function deletePackageAction(id: string): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(id);
  if (!pid) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const pkg = await tx.package.findUnique({
      where: { id: pid },
      select: { _count: { select: { packageProducts: true } } },
    });
    if (!pkg) return { ok: false as const, error: 'Paquete no encontrado' };
    if (pkg._count.packageProducts > 0) {
      return {
        ok: false as const,
        error: `Este paquete tiene ${pkg._count.packageProducts} recepción(es). Elimínalas desde «Marcado en este paquete» antes de borrarlo.`,
      };
    }
    await tx.package.delete({ where: { id: pid } });
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidatePath('/packages');
  revalidatePath('/delivery/prepare');
  return { ok: true };
}


type ArrivalItem = { productId: string; amount: number; observation?: string | null };

/**
 * Núcleo del lote de llegadas, reutilizado por registerArrivalsAction y
 * por la creación de paquete con llegadas. Debe correr dentro de una
 * transacción.
 */
async function registerArrivalsInTx(
  tx: Prisma.TransactionClient,
  pid: bigint,
  items: ArrivalItem[]
): Promise<
  | { ok: true; bags: BagSummary[]; statusChanged: boolean }
  | { ok: false; error: string }
> {
  const productIds = items.map((i) => i.productId);
  const pkg = await tx.package.findUnique({
    where: { id: pid },
    select: { id: true, statusOfProcessing: true },
  });
  if (!pkg) return { ok: false, error: 'Paquete no encontrado' };
  if (pkg.statusOfProcessing === 'Procesado') {
    return {
      ok: false,
      error:
        'La revisión de este paquete está cerrada; un administrador puede reabrirla',
    };
  }

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      amountPurchased: true,
      amountReceived: true,
      categoryId: true,
      category: { select: { name: true } },
      order: {
        select: {
          clientId: true,
          client: { select: { name: true, lastName: true } },
        },
      },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) return { ok: false, error: 'Producto no encontrado' };
    const remaining = p.amountPurchased - p.amountReceived;
    if (item.amount > remaining) {
      return {
        ok: false,
        error: `Solo quedan ${Math.max(0, remaining)} unidad(es) de «${p.name}» compradas sin recibir`,
      };
    }
    // La categoría decide en qué bolsa cae el producto (INV-002).
    if (p.categoryId === null) {
      return {
        ok: false,
        error: `«${p.name}» no tiene categoría asignada; asígnala desde el checklist antes de procesarlo`,
      };
    }
  }

  await tx.productReceived.createMany({
    data: items.map((i) => ({
      packageId: pid,
      originalProductId: i.productId,
      amountReceived: i.amount,
      observation: i.observation ?? null,
    })),
  });

  const bags = new Map<string, BagSummary>();
  for (const item of items) {
    const p = byId.get(item.productId)!;
    const { bagId, created } = await addUnitsToOpenBag(tx, {
      productId: item.productId,
      clientId: p.order.clientId,
      categoryId: p.categoryId!,
      amount: item.amount,
    });
    const key = bagId.toString();
    const entry = bags.get(key);
    if (entry) {
      entry.units += item.amount;
      entry.created = entry.created || created;
    } else {
      bags.set(key, {
        deliveryId: key,
        clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        categoryName: p.category?.name ?? '',
        units: item.amount,
        created,
      });
    }
  }

  for (const item of items) {
    await recomputeProductAmounts(item.productId, tx);
  }
  let statusChanged = false;
  if (pkg.statusOfProcessing === 'Enviado') {
    await tx.package.update({
      where: { id: pid },
      data: { statusOfProcessing: 'Recibido' },
    });
    statusChanged = true;
  }
  return { ok: true, bags: [...bags.values()], statusChanged };
}

/**
 * Lote de llegadas de un paquete: N filas de ProductReceived, cada
 * unidad cae en la bolsa abierta de su cliente+categoría (creándola si
 * hace falta) y el paquete pasa solo de «Enviado» a «Recibido».
 * Transaccional: si algún producto ya no tiene unidades compradas
 * pendientes (otra sesión se adelantó) o no tiene categoría, no se
 * registra nada.
 */
export async function registerArrivalsAction(
  input: ArrivalBatchInput
): Promise<ArrivalsResult> {
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
  if (!pid) return { ok: false, error: 'Identificador inválido' };
  const productIds = d.items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  const result = await prisma.$transaction(
    (tx) => registerArrivalsInTx(tx, pid, d.items),
    // Un lote grande recalcula muchos productos sobre el driver de
    // Neon; el timeout por defecto (5 s) se queda corto.
    { timeout: 60_000, maxWait: 10_000 }
  );

  if (!result.ok) return result;
  revalidateReceptionViews(d.packageId);
  return result;
}

/**
 * Deshacer una recepción retira sus unidades de las bolsas abiertas del
 * cliente+categoría. Si ya están en una entrega pesada o despachada
 * (la bolsa se cerró), se bloquea: hay que sacarlas de esa entrega
 * primero para no dejar entregado > recibido.
 */
export async function removeReceivedProductAction(
  packageId: string,
  productReceivedId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const pid = parseId(packageId);
  const rowId = parseId(productReceivedId);
  if (!pid || !rowId) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.productReceived.findUnique({
      where: { id: rowId },
      select: {
        packageId: true,
        amountReceived: true,
        originalProductId: true,
        originalProduct: {
          select: {
            name: true,
            categoryId: true,
            amountReceived: true,
            amountDelivered: true,
            order: { select: { clientId: true } },
          },
        },
      },
    });
    if (!row || row.packageId !== pid) {
      return { ok: false as const, error: 'Recepción no encontrada en este paquete' };
    }
    const p = row.originalProduct;

    const inOpenBags =
      p.categoryId === null
        ? 0
        : await countUnitsInOpenBags(tx, {
            productId: row.originalProductId,
            clientId: p.order.clientId,
            categoryId: p.categoryId,
          });
    const pullable = Math.min(inOpenBags, row.amountReceived);
    const newReceived = p.amountReceived - row.amountReceived;
    const newDelivered = p.amountDelivered - pullable;
    if (newDelivered > newReceived) {
      return {
        ok: false as const,
        error: `No se puede eliminar: ${newDelivered - newReceived} unidad(es) de «${p.name}» ya están en una entrega pesada o despachada. Quítalas de esa entrega primero.`,
      };
    }

    if (pullable > 0 && p.categoryId !== null) {
      await pullUnitsFromOpenBags(tx, {
        productId: row.originalProductId,
        clientId: p.order.clientId,
        categoryId: p.categoryId,
        amount: row.amountReceived,
      });
    }
    await tx.productReceived.delete({ where: { id: rowId } });
    await recomputeProductAmounts(row.originalProductId, tx);
    return { ok: true as const };
  });

  if (!result.ok) return result;
  revalidateReceptionViews(packageId);
  return result;
}

/** Error de validación del lote que fuerza el rollback de la transacción. */
class ArrivalsError extends Error {}

/**
 * Alta de paquete con sus llegadas en la misma vista (/packages/new):
 * crea el paquete y registra el lote en UNA transacción; si no hay
 * llegadas marcadas, solo crea el paquete.
 */
export async function createPackageWithArrivalsAction(
  input: PackageWithArrivalsInput
): Promise<ArrivalsResult> {
  const { denied } = await requireRole(ROLES.packages);
  if (denied) return denied;

  const parsed = packageWithArrivalsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const ids = d.items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Hay productos repetidos en la selección' };
  }

  let result: { ok: true; id: string; bags: BagSummary[] };
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const created = await tx.package.create({
          data: {
            agencyName: d.agencyName,
            numberOfTracking: d.numberOfTracking,
            statusOfProcessing:
              d.alreadyArrived || d.items.length > 0 ? 'Recibido' : 'Enviado',
            arrivalDate: new Date(d.arrivalDate),
            packagePicture: d.packagePicture,
            packagePicture2: d.packagePicture2,
          },
          select: { id: true },
        });
        if (d.items.length === 0) {
          return { ok: true as const, id: created.id.toString(), bags: [] };
        }
        const arrivals = await registerArrivalsInTx(tx, created.id, d.items);
        if (!arrivals.ok) throw new ArrivalsError(arrivals.error);
        return { ok: true as const, id: created.id.toString(), bags: arrivals.bags };
      },
      { timeout: 60_000, maxWait: 10_000 }
    );
  } catch (err) {
    if (err instanceof ArrivalsError) return { ok: false, error: err.message };
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: false,
        error: 'Ya existe un paquete con ese número de tracking',
        fieldErrors: { numberOfTracking: 'Ya existe' },
      };
    }
    throw err;
  }

  revalidateReceptionViews(result.id);
  return result;
}
