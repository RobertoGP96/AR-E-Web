import { prisma } from '@/lib/prisma';
import type {
  ArrivalCandidate,
  CategoryChoice,
  PackageReception,
} from './types';

/**
 * Consultas de solo lectura de recepción (solo desde páginas server).
 * Los candidatos de llegada son los productos con unidades compradas
 * aún sin recibir, de cualquier tienda; un agente solo ve los de sus
 * clientes asignados.
 */

const CANDIDATE_LIMIT = 1000;

export async function loadArrivalCandidates(opts: {
  agentId?: bigint | null;
}): Promise<{ candidates: ArrivalCandidate[]; truncated: boolean }> {
  const rows = await prisma.product.findMany({
    where: {
      amountPurchased: { gt: 0 },
      amountReceived: { lt: prisma.product.fields.amountPurchased },
      ...(opts.agentId
        ? { order: { client: { assignedAgentId: opts.agentId } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      amountRequested: true,
      amountPurchased: true,
      amountReceived: true,
      categoryId: true,
      category: { select: { name: true } },
      shopId: true,
      shop: { select: { name: true } },
      buys: { select: { shopingReceipId: true } },
      order: {
        select: {
          id: true,
          clientId: true,
          client: { select: { name: true, lastName: true, phoneNumber: true } },
        },
      },
    },
    orderBy: [{ order: { client: { name: 'asc' } } }, { name: 'asc' }],
    take: CANDIDATE_LIMIT + 1,
  });
  const candidates: ArrivalCandidate[] = rows
    .slice(0, CANDIDATE_LIMIT)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      orderId: p.order.id.toString(),
      clientId: p.order.clientId.toString(),
      clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
      clientPhone: p.order.client.phoneNumber,
      shopId: p.shopId.toString(),
      shopName: p.shop.name,
      purchaseIds: [
        ...new Set(
          p.buys
            .map((b) => b.shopingReceipId)
            .filter((id): id is bigint => id !== null)
            .map((id) => id.toString())
        ),
      ],
      requested: p.amountRequested,
      purchased: p.amountPurchased,
      received: p.amountReceived,
      pendingArrival: p.amountPurchased - p.amountReceived,
      categoryId: p.categoryId ? p.categoryId.toString() : null,
      categoryName: p.category?.name ?? null,
    }))
    .filter((c) => c.pendingArrival > 0);
  return { candidates, truncated: rows.length > CANDIDATE_LIMIT };
}

/** Recepciones de uno o varios paquetes, agrupables por paquete. */
export async function loadReceptions(
  packageIds: bigint[]
): Promise<Map<string, PackageReception[]>> {
  const rows = await prisma.productReceived.findMany({
    where: { packageId: { in: packageIds } },
    select: {
      id: true,
      packageId: true,
      amountReceived: true,
      observation: true,
      originalProduct: {
        select: {
          id: true,
          name: true,
          category: { select: { name: true } },
          order: { select: { client: { select: { name: true, lastName: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const byPackage = new Map<string, PackageReception[]>();
  for (const r of rows) {
    if (r.packageId === null) continue;
    const key = r.packageId.toString();
    const list = byPackage.get(key) ?? [];
    list.push({
      id: r.id.toString(),
      productId: r.originalProduct.id,
      productName: r.originalProduct.name,
      clientName:
        `${r.originalProduct.order.client.name} ${r.originalProduct.order.client.lastName}`.trim(),
      categoryName: r.originalProduct.category?.name ?? null,
      amount: r.amountReceived,
      observation: r.observation,
    });
    byPackage.set(key, list);
  }
  return byPackage;
}

export async function loadCategoryChoices(): Promise<CategoryChoice[]> {
  const rows = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return rows.map((c) => ({ id: c.id.toString(), label: c.name }));
}
