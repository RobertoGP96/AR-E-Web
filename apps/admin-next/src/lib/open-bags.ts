import type { Prisma } from '@prisma/client';

type Db = Prisma.TransactionClient;

/**
 * "Bolsa abierta" del flujo de preparación: una DeliverReceip en
 * «Pendiente» con peso 0 que hace de bolsa física del cliente para una
 * categoría. Al procesar paquetes, cada unidad recibida cae aquí como
 * ProductDelivery (una fila por producto y bolsa, se acumula). Registrar
 * el peso la cierra: deja de ser candidata y las llegadas posteriores de
 * esa categoría abren otra bolsa.
 *
 * No hay tabla propia (la BD la posee Django y no se migra): el estado
 * «bolsa abierta» se deriva por completo de status + weight.
 */

/** Resumen de a qué bolsa cayeron unidades, para toasts y feedback. */
export interface BagSummary {
  deliveryId: string;
  clientName: string;
  categoryName: string;
  units: number;
  /** true si la bolsa se creó en esta operación. */
  created: boolean;
}

/** Texto de toast: a qué bolsas cayeron las unidades registradas. */
export function describeBags(bags: BagSummary[] | undefined): string {
  if (!bags || bags.length === 0) return '';
  return bags
    .map(
      (b) =>
        `${b.units} u. → ${b.categoryName || 'Sin categoría'} · ${b.clientName}${
          b.created ? ' (bolsa nueva)' : ''
        }`
    )
    .join(' · ');
}

const OPEN_BAG_WHERE = { status: 'Pendiente', weight: 0 } as const;

/**
 * Suma unidades de un producto a la bolsa abierta del cliente+categoría,
 * creándola si no existe. Devuelve la bolsa tocada. Debe correr dentro
 * de una transacción y el caller debe llamar recomputeProductAmounts
 * después (las filas de ProductDelivery cuentan como "entregado").
 */
export async function addUnitsToOpenBag(
  db: Db,
  input: {
    productId: string;
    clientId: bigint;
    categoryId: bigint;
    amount: number;
  }
): Promise<{ bagId: bigint; created: boolean }> {
  let created = false;
  let bag = await db.deliverReceip.findFirst({
    where: {
      clientId: input.clientId,
      categoryId: input.categoryId,
      ...OPEN_BAG_WHERE,
    },
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  if (!bag) {
    bag = await db.deliverReceip.create({
      data: {
        clientId: input.clientId,
        categoryId: input.categoryId,
        weight: 0,
        status: 'Pendiente',
        paymentStatus: 'No pagado',
        paymentAmount: 0,
        balanceApplied: 0,
        paymentDate: null,
        deliverDate: new Date(),
        deliverPicture: null,
        weightCost: 0,
        managerProfit: 0,
      },
      select: { id: true },
    });
    created = true;
  }

  const row = await db.productDelivery.findFirst({
    where: {
      deliverReceipId: bag.id,
      originalProductId: input.productId,
    },
    select: { id: true, amountDelivered: true },
  });
  if (row) {
    await db.productDelivery.update({
      where: { id: row.id },
      data: { amountDelivered: row.amountDelivered + input.amount },
    });
  } else {
    await db.productDelivery.create({
      data: {
        deliverReceipId: bag.id,
        originalProductId: input.productId,
        amountDelivered: input.amount,
      },
    });
  }
  return { bagId: bag.id, created };
}

/**
 * Unidades de un producto que están en bolsas abiertas del
 * cliente+categoría — lo máximo que una eliminación de recepción puede
 * retirar sin tocar entregas ya pesadas.
 */
export async function countUnitsInOpenBags(
  db: Db,
  input: { productId: string; clientId: bigint; categoryId: bigint }
): Promise<number> {
  const agg = await db.productDelivery.aggregate({
    where: {
      originalProductId: input.productId,
      deliverReceip: {
        clientId: input.clientId,
        categoryId: input.categoryId,
        ...OPEN_BAG_WHERE,
      },
    },
    _sum: { amountDelivered: true },
  });
  return agg._sum.amountDelivered ?? 0;
}

/**
 * Retira hasta `amount` unidades del producto de las bolsas abiertas del
 * cliente+categoría (las más nuevas primero) y borra las bolsas que
 * queden vacías. Devuelve cuántas unidades retiró de verdad; el caller
 * decide qué hacer si no alcanzó (p. ej. bloquear la eliminación de una
 * recepción cuyas unidades ya están en una entrega pesada).
 */
export async function pullUnitsFromOpenBags(
  db: Db,
  input: {
    productId: string;
    clientId: bigint;
    categoryId: bigint;
    amount: number;
  }
): Promise<number> {
  const rows = await db.productDelivery.findMany({
    where: {
      originalProductId: input.productId,
      deliverReceip: {
        clientId: input.clientId,
        categoryId: input.categoryId,
        ...OPEN_BAG_WHERE,
      },
    },
    orderBy: { id: 'desc' },
    select: { id: true, amountDelivered: true, deliverReceipId: true },
  });

  let remaining = input.amount;
  const touchedBags = new Set<bigint>();
  for (const row of rows) {
    if (remaining <= 0) break;
    const take = Math.min(row.amountDelivered, remaining);
    if (take === row.amountDelivered) {
      await db.productDelivery.delete({ where: { id: row.id } });
    } else {
      await db.productDelivery.update({
        where: { id: row.id },
        data: { amountDelivered: row.amountDelivered - take },
      });
    }
    remaining -= take;
    if (row.deliverReceipId !== null) touchedBags.add(row.deliverReceipId);
  }

  for (const bagId of touchedBags) {
    await deleteBagIfEmpty(db, bagId);
  }
  return input.amount - remaining;
}

/**
 * Borra una bolsa abierta que se quedó sin productos (y sin pagos, por
 * si alguien registró un pago sobre una entrega de peso 0 a mano): una
 * entrega Pendiente vacía solo estorba en las vistas del cliente.
 */
export async function deleteBagIfEmpty(
  db: Db,
  bagId: bigint
): Promise<boolean> {
  const count = await db.productDelivery.count({
    where: { deliverReceipId: bagId },
  });
  if (count > 0) return false;
  const bag = await db.deliverReceip.findUnique({
    where: { id: bagId },
    select: {
      status: true,
      weight: true,
      paymentAmount: true,
      balanceApplied: true,
    },
  });
  if (
    !bag ||
    bag.status !== 'Pendiente' ||
    bag.weight !== 0 ||
    bag.paymentAmount !== 0 ||
    bag.balanceApplied !== 0
  ) {
    return false;
  }
  await db.deliverReceip.delete({ where: { id: bagId } });
  return true;
}
