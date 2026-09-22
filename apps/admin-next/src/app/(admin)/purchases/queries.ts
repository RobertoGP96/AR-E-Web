import { prisma } from '@/lib/prisma';
import type {
  PendingCandidates,
  PendingClientGroup,
  PendingProduct,
  ShopWithAccounts,
} from './schema';

/**
 * Consultas de solo lectura del dominio de compras (solo desde páginas
 * server: importa Prisma). Los candidatos de compra son los productos
 * con unidades pedidas que aún no se han comprado, agrupados por
 * cliente para el checklist.
 */

const PENDING_WHERE = {
  // amountPurchased < amountRequested, sin depender del `status` guardado
  // (un import antiguo puede haberlo dejado inconsistente).
  amountPurchased: { lt: prisma.product.fields.amountRequested },
  order: { status: { not: 'Cancelado' } },
} as const;

const CANDIDATE_LIMIT = 500;

/** Tiendas activas con sus cuentas y el conteo de pendientes. */
export async function loadShopOptions(): Promise<ShopWithAccounts[]> {
  const [shops, pending] = await Promise.all([
    prisma.shop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        buyingAccounts: {
          select: { id: true, accountName: true },
          orderBy: { accountName: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.product.groupBy({
      by: ['shopId'],
      where: PENDING_WHERE,
      _count: { _all: true },
      _sum: { amountRequested: true, amountPurchased: true },
    }),
  ]);
  const byShop = new Map(
    pending.map((p) => [
      p.shopId.toString(),
      {
        products: p._count._all,
        units:
          (p._sum.amountRequested ?? 0) - (p._sum.amountPurchased ?? 0),
      },
    ])
  );
  return shops.map((s) => {
    const agg = byShop.get(s.id.toString());
    return {
      id: s.id.toString(),
      label: s.name,
      accounts: s.buyingAccounts.map((a) => ({
        id: a.id.toString(),
        label: a.accountName,
      })),
      pendingProducts: agg?.products ?? 0,
      pendingUnits: Math.max(0, agg?.units ?? 0),
    };
  });
}

/** Candidatos pendientes de una tienda, agrupados por cliente. */
export async function loadPendingCandidates(
  shopId: bigint,
  opts: { orderId?: bigint } = {}
): Promise<PendingCandidates> {
  const rows = await prisma.product.findMany({
    where: {
      shopId,
      ...PENDING_WHERE,
      ...(opts.orderId !== undefined && { orderId: opts.orderId }),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      orderId: true,
      amountRequested: true,
      amountPurchased: true,
      shopCost: true,
      shopDeliveryCost: true,
      shopTaxes: true,
      chargeIva: true,
      addedTaxes: true,
      ownTaxes: true,
      totalCost: true,
      order: {
        select: {
          clientId: true,
          client: {
            select: { name: true, lastName: true, phoneNumber: true },
          },
        },
      },
    },
    orderBy: [{ order: { client: { name: 'asc' } } }, { name: 'asc' }],
    take: CANDIDATE_LIMIT + 1,
  });
  const truncated = rows.length > CANDIDATE_LIMIT;
  const groups = new Map<string, PendingClientGroup>();
  let totalUnits = 0;
  for (const p of rows.slice(0, CANDIDATE_LIMIT)) {
    const pending = p.amountRequested - p.amountPurchased;
    if (pending <= 0) continue;
    const clientId = p.order.clientId.toString();
    let group = groups.get(clientId);
    if (!group) {
      group = {
        clientId,
        clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        phoneNumber: p.order.client.phoneNumber,
        products: [],
      };
      groups.set(clientId, group);
    }
    const product: PendingProduct = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      orderId: p.orderId.toString(),
      amountRequested: p.amountRequested,
      amountPurchased: p.amountPurchased,
      pending,
      cost: {
        shopCost: p.shopCost,
        amountRequested: p.amountRequested,
        shopDeliveryCost: p.shopDeliveryCost,
        shopTaxes: p.shopTaxes,
        chargeIva: p.chargeIva,
        addedTaxes: p.addedTaxes,
        ownTaxes: p.ownTaxes,
        totalCost: p.totalCost,
      },
    };
    group.products.push(product);
    totalUnits += pending;
  }
  const list = [...groups.values()].sort((a, b) =>
    a.clientName.localeCompare(b.clientName)
  );
  return {
    groups: list,
    totalProducts: list.reduce((s, g) => s + g.products.length, 0),
    totalUnits,
    truncated,
  };
}

/** Tiendas con pendientes de una orden (para «Comprar pendientes»). */
export async function loadPendingShopsOfOrder(
  orderId: bigint
): Promise<{ shopId: string; shopName: string; products: number; units: number }[]> {
  const rows = await prisma.product.findMany({
    where: { orderId, ...PENDING_WHERE },
    select: {
      shopId: true,
      amountRequested: true,
      amountPurchased: true,
      shop: { select: { name: true } },
    },
  });
  const byShop = new Map<
    string,
    { shopId: string; shopName: string; products: number; units: number }
  >();
  for (const r of rows) {
    const key = r.shopId.toString();
    const entry = byShop.get(key) ?? {
      shopId: key,
      shopName: r.shop.name,
      products: 0,
      units: 0,
    };
    entry.products += 1;
    entry.units += r.amountRequested - r.amountPurchased;
    byShop.set(key, entry);
  }
  return [...byShop.values()].sort((a, b) => a.shopName.localeCompare(b.shopName));
}
