'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/action-helpers';
import type { ActionFailure } from '@/lib/action-helpers';

export type PurgeResult = { ok: true; deleted: number } | ActionFailure;

/**
 * Ámbitos de limpieza de Configuración → Limpieza. La BD es propiedad
 * de Django y sus FKs no tienen cascadas a nivel de base de datos
 * (Django emula on_delete en el ORM), por lo que cada ámbito borra
 * explícitamente las tablas hijas antes que las padres, dentro de una
 * misma transacción.
 */
const scopeSchema = z.enum([
  'operations',
  'purchases',
  'packages',
  'deliveries',
  'expenses',
  'invoices',
  'balances',
  'notifications-read',
  'notifications',
  'shops',
  'categories',
  'clients',
  'all',
]);

export type PurgeScope = z.infer<typeof scopeSchema>;

type Db = Prisma.TransactionClient;

/**
 * Recalcula el estado de TODOS los productos a partir de sus
 * contadores, con la misma lógica de deriveProductStatus() pero en
 * cuatro UPDATE masivos (los tres estados avanzados son mutuamente
 * excluyentes, así que el orden solo pisa el 'Encargado' inicial).
 */
async function recomputeAllProductStatuses(tx: Db): Promise<void> {
  const f = prisma.product.fields;
  await tx.product.updateMany({ data: { status: 'Encargado' } });
  await tx.product.updateMany({
    where: {
      AND: [
        { amountPurchased: { gt: 0, gte: f.amountRequested } },
        { amountReceived: { lt: f.amountRequested } },
      ],
    },
    data: { status: 'Comprado' },
  });
  await tx.product.updateMany({
    where: {
      AND: [
        { amountPurchased: { gte: f.amountRequested } },
        { amountReceived: { gt: 0, gte: f.amountRequested } },
        { amountDelivered: { lt: f.amountReceived } },
      ],
    },
    data: { status: 'Recibido' },
  });
  await tx.product.updateMany({
    where: {
      AND: [
        { amountPurchased: { gte: f.amountRequested } },
        { amountReceived: { gte: f.amountRequested } },
        { amountDelivered: { gt: 0, gte: f.amountReceived } },
        { amountDelivered: { gte: f.amountPurchased } },
      ],
    },
    data: { status: 'Entregado' },
  });
}

async function purgePurchaseRows(tx: Db): Promise<number> {
  const rows = await tx.productBuyed.deleteMany({});
  const receipts = await tx.shoppingReceip.deleteMany({});
  return rows.count + receipts.count;
}

async function purgePackageRows(tx: Db): Promise<number> {
  const rows = await tx.productReceived.deleteMany({});
  const packages = await tx.package.deleteMany({});
  return rows.count + packages.count;
}

async function purgeDeliveryRows(tx: Db): Promise<number> {
  const rows = await tx.productDelivery.deleteMany({});
  const receipts = await tx.deliverReceip.deleteMany({});
  return rows.count + receipts.count;
}

/** Todo el flujo operativo: órdenes, productos, compras, paquetes y
 * entregas, con sus renglones. */
async function purgeOperations(tx: Db): Promise<number> {
  let n = 0;
  n += await purgeDeliveryRows(tx);
  n += await purgePackageRows(tx);
  n += await purgePurchaseRows(tx);
  n += (await tx.product.deleteMany({})).count;
  n += (await tx.order.deleteMany({})).count;
  return n;
}

async function purgeInvoiceRows(tx: Db): Promise<number> {
  const tags = await tx.tag.deleteMany({});
  const invoices = await tx.invoice.deleteMany({});
  return tags.count + invoices.count;
}

/**
 * Elimina las cuentas de rol cliente. Presupone que ya no quedan
 * órdenes ni entregas (el guard del action lo verifica); aquí solo se
 * desengancha lo que puede apuntar a un cliente sin ser parte del
 * flujo operativo.
 */
async function purgeClients(tx: Db): Promise<number> {
  await tx.notification.updateMany({
    where: { sender: { role: 'client' } },
    data: { senderId: null },
  });
  let n = (
    await tx.notification.deleteMany({
      where: { recipient: { role: 'client' } },
    })
  ).count;
  await tx.expense.updateMany({
    where: { createdBy: { role: 'client' } },
    data: { createdById: null },
  });
  await tx.customUser.updateMany({
    where: { assignedAgent: { role: 'client' } },
    data: { assignedAgentId: null },
  });
  n += (await tx.customUser.deleteMany({ where: { role: 'client' } })).count;
  return n;
}

/**
 * Vacía el ámbito indicado. Solo administradores. Devuelve cuántos
 * registros se eliminaron. Nunca toca el personal (staff) ni los
 * parámetros del sistema (CommonInformation).
 */
export async function purgeDataAction(rawScope: string): Promise<PurgeResult> {
  const { denied } = await requireRole(ROLES.users);
  if (denied) return denied;

  const parsed = scopeSchema.safeParse(rawScope);
  if (!parsed.success) {
    return { ok: false, error: 'Ámbito de limpieza desconocido.' };
  }
  const scope = parsed.data;

  // Guards de integridad: estas tablas están referenciadas por el flujo
  // operativo con FKs no anulables, así que hay que vaciarlo primero.
  if (scope === 'shops') {
    const [products, purchases] = await prisma.$transaction([
      prisma.product.count(),
      prisma.shoppingReceip.count(),
    ]);
    if (products > 0 || purchases > 0) {
      return {
        ok: false,
        error:
          'Hay productos o compras que referencian a las tiendas. Vacía primero el flujo de operaciones.',
      };
    }
  }
  if (scope === 'clients') {
    const [orders, deliveries] = await prisma.$transaction([
      prisma.order.count(),
      prisma.deliverReceip.count(),
    ]);
    if (orders > 0 || deliveries > 0) {
      return {
        ok: false,
        error:
          'Hay órdenes o entregas que pertenecen a clientes. Vacía primero el flujo de operaciones.',
      };
    }
  }

  try {
    const deleted = await prisma.$transaction(
      async (tx) => {
        switch (scope) {
          case 'operations':
            return purgeOperations(tx);
          case 'purchases': {
            const n = await purgePurchaseRows(tx);
            await tx.product.updateMany({ data: { amountPurchased: 0 } });
            await recomputeAllProductStatuses(tx);
            return n;
          }
          case 'packages': {
            const n = await purgePackageRows(tx);
            await tx.product.updateMany({ data: { amountReceived: 0 } });
            await recomputeAllProductStatuses(tx);
            return n;
          }
          case 'deliveries': {
            const n = await purgeDeliveryRows(tx);
            await tx.product.updateMany({ data: { amountDelivered: 0 } });
            await recomputeAllProductStatuses(tx);
            return n;
          }
          case 'expenses':
            return (await tx.expense.deleteMany({})).count;
          case 'invoices':
            return purgeInvoiceRows(tx);
          case 'balances':
            return (await tx.balance.deleteMany({})).count;
          case 'notifications-read':
            return (
              await tx.notification.deleteMany({
                where: {
                  OR: [
                    { isRead: true },
                    { expiresAt: { lt: new Date() } },
                  ],
                },
              })
            ).count;
          case 'notifications':
            return (await tx.notification.deleteMany({})).count;
          case 'shops': {
            const accounts = await tx.buyingAccounts.deleteMany({});
            const shops = await tx.shop.deleteMany({});
            return accounts.count + shops.count;
          }
          case 'categories': {
            await tx.product.updateMany({ data: { categoryId: null } });
            await tx.deliverReceip.updateMany({ data: { categoryId: null } });
            return (await tx.category.deleteMany({})).count;
          }
          case 'clients':
            return purgeClients(tx);
          case 'all': {
            let n = await purgeOperations(tx);
            n += await purgeInvoiceRows(tx);
            n += (await tx.expense.deleteMany({})).count;
            n += (await tx.balance.deleteMany({})).count;
            n += (await tx.notification.deleteMany({})).count;
            n += (await tx.buyingAccounts.deleteMany({})).count;
            n += (await tx.shop.deleteMany({})).count;
            n += (await tx.category.deleteMany({})).count;
            n += await purgeClients(tx);
            return n;
          }
        }
      },
      // Los vaciados masivos pueden tardar más que el timeout por
      // defecto (5 s) de las transacciones interactivas.
      { timeout: 120_000, maxWait: 10_000 }
    );

    // La limpieza afecta a casi todas las vistas del panel.
    revalidatePath('/', 'layout');
    return { ok: true, deleted };
  } catch (error) {
    console.error('[settings/cleanup] purge failed', { scope, error });
    return {
      ok: false,
      error:
        'La limpieza falló y no se aplicó ningún cambio. Revisa la conexión e inténtalo de nuevo.',
    };
  }
}
