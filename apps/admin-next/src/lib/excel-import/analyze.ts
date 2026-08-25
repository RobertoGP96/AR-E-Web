import { prisma } from '@/lib/prisma';
import { computeProductCost } from '@/lib/order-cost';

import { normName } from './parse';
import type {
  AgentEntry,
  ClientEntry,
  ImportAnalysis,
  ItemEntry,
  ParsedWorkbook,
  SimilarUser,
} from './types';

/**
 * Contraste del libro parseado con la base de datos: marca cada entidad
 * como nueva o existente, sugiere posibles duplicados de clientes y
 * calcula el costo que cobrará el sistema por cada artículo.
 */

/**
 * Tarifa de tienda (%) que replica los multiplicadores del Excel:
 * cobro = valor × 1.07 × (1 + tarifa/100). Shein 1.07 → 0 %,
 * Amazon ×1.01 → 1 %, Temu ×1.03 → 3 %, resto ("Otras 5%") → 5 %.
 */
export function shopTaxesFor(sheet: string, storeName: string | null): number {
  const key = normName(storeName ?? sheet);
  if (key === 'shein') return 0;
  if (key === 'amazon') return 1;
  if (key === 'temu') return 3;
  return 5;
}

/** Distancia de Levenshtein acotada (nombres cortos). */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[m];
}

interface DbUser {
  id: bigint;
  name: string;
  lastName: string;
  role: string;
}

function fullName(u: DbUser): string {
  return `${u.name} ${u.lastName}`.trim();
}

function findSimilar(clientKey: string, users: DbUser[]): SimilarUser[] {
  const out: SimilarUser[] = [];
  for (const u of users) {
    const key = normName(fullName(u));
    if (!key || key === clientKey) continue;
    const close =
      editDistance(clientKey, key) <= 2 ||
      (clientKey.length >= 6 &&
        (key.includes(clientKey) || clientKey.includes(key)));
    if (close) {
      out.push({ id: u.id.toString(), fullName: fullName(u) });
      if (out.length >= 3) break;
    }
  }
  return out;
}

export async function analyzeWorkbook(
  parsed: ParsedWorkbook
): Promise<ImportAnalysis> {
  const [shops, users, accounts, importedOrders] = await Promise.all([
    prisma.shop.findMany({ select: { id: true, name: true } }),
    prisma.customUser.findMany({
      select: { id: true, name: true, lastName: true, role: true },
    }),
    prisma.buyingAccounts.findMany({
      select: {
        id: true,
        accountName: true,
        shop: { select: { name: true } },
      },
    }),
    prisma.order.count({
      where: { observations: { contains: parsed.fileName } },
    }),
  ]);

  const shopByKey = new Map(shops.map((s) => [normName(s.name), s]));
  const userByKey = new Map<string, DbUser>();
  for (const u of users) {
    const key = normName(fullName(u));
    if (key && !userByKey.has(key)) userByKey.set(key, u);
  }
  const accountByKey = new Map(
    accounts.map((a) => [
      `${normName(a.shop?.name ?? '')}::${normName(a.accountName)}`,
      a,
    ])
  );

  const itemCountByClient = new Map<string, number>();
  for (const item of parsed.items) {
    const key = normName(item.client);
    itemCountByClient.set(key, (itemCountByClient.get(key) ?? 0) + 1);
  }

  const agents: AgentEntry[] = parsed.agents.map((a) => {
    const existing = userByKey.get(normName(a.name));
    return {
      ...a,
      status: existing ? 'existing' : 'new',
      existingId: existing ? existing.id.toString() : null,
      existingRole: existing ? existing.role : null,
    };
  });

  const clients: ClientEntry[] = parsed.clients.map((c) => {
    const key = normName(c.name);
    const existing = userByKey.get(key);
    return {
      ...c,
      status: existing ? 'existing' : 'new',
      existingId: existing ? existing.id.toString() : null,
      similar: existing ? [] : findSimilar(key, users),
      itemCount: itemCountByClient.get(key) ?? 0,
    };
  });

  const items: ItemEntry[] = parsed.items.map((item) => {
    const shopTaxes = shopTaxesFor(item.sheet, item.storeName);
    const cost = computeProductCost({
      shopCost: item.unitValue ?? 0,
      amountRequested: item.quantity,
      shopDeliveryCost: 0,
      shopTaxes,
      chargeIva: true,
      addedTaxes: 0,
      ownTaxes: 0,
    });
    return {
      ...item,
      computed: { shopTaxes, totalCost: cost.totalCost },
      hasError: item.issues.some((i) => i.level === 'error'),
    };
  });

  return {
    fileName: parsed.fileName,
    shipmentTag: parsed.shipmentTag,
    shops: parsed.shops.map((name) => {
      const key = normName(name);
      const existing = shopByKey.get(key);
      const used =
        parsed.items.some(
          (i) => normName(i.storeName ?? i.sheet) === key
        ) || parsed.accounts.some((a) => normName(a.store) === key);
      return {
        name,
        status: existing ? 'existing' : 'new',
        existingId: existing ? existing.id.toString() : null,
        used,
      };
    }),
    agents,
    clients,
    accounts: parsed.accounts.map((a) => {
      const existing = accountByKey.get(
        `${normName(a.store)}::${normName(a.name)}`
      );
      return {
        ...a,
        status: existing ? 'existing' : 'new',
        existingId: existing ? existing.id.toString() : null,
      };
    }),
    items,
    receipts: parsed.receipts,
    expenses: parsed.expenses,
    skipped: parsed.skipped,
    globalIssues: parsed.globalIssues,
    alreadyImported: importedOrders > 0,
  };
}
