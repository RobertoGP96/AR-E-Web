'use server';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';

import { prisma } from '@/lib/prisma';
import { requireRole, zodFieldErrors, parseId } from '@/lib/action-helpers';
import type { ActionFailure } from '@/lib/action-helpers';
import { computeProductCost, computePayStatus } from '@/lib/order-cost';
import { recalculateClientBalance } from '@/lib/balance';
import { parseWorkbook, normName } from '@/lib/excel-import/parse';
import { analyzeWorkbook, shopTaxesFor } from '@/lib/excel-import/analyze';
import type {
  ImportAnalysis,
  ImportSummary,
} from '@/lib/excel-import/types';
import { EXPENSE_CATEGORIES } from '../../expenses/schema';
import { importPayloadSchema, type ImportPayload } from './schema';

const IMPORT_ROLES = ['admin'] as const;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export type AnalyzeResult =
  | { ok: true; analysis: ImportAnalysis }
  | ActionFailure;

export async function analyzeExcelAction(
  formData: FormData
): Promise<AnalyzeResult> {
  const { denied } = await requireRole(IMPORT_ROLES);
  if (denied) return denied;

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Selecciona un archivo .xlsx.' };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return {
      ok: false,
      error: 'Solo se admiten libros de Excel (.xlsx).',
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'El archivo supera el límite de 8 MB.' };
  }

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const parsed = parseWorkbook(wb, file.name);
    const analysis = await analyzeWorkbook(parsed);
    return { ok: true, analysis };
  } catch (err) {
    console.error('[import] analyze failed', err);
    return {
      ok: false,
      error:
        'No se pudo leer el archivo. Verifica que sea un libro de embarque AR&E válido.',
    };
  }
}

// ---------------------------------------------------------------------------
// Importación
// ---------------------------------------------------------------------------

/** Enlaces reales de las tiendas conocidas (Shop.link es único y requerido). */
const KNOWN_SHOP_LINKS: Record<string, string> = {
  amazon: 'https://www.amazon.com',
  shein: 'https://www.shein.com',
  temu: 'https://www.temu.com',
  aliexpress: 'https://www.aliexpress.com',
  ebay: 'https://www.ebay.com',
  walmart: 'https://www.walmart.com',
  nike: 'https://www.nike.com',
  adidas: 'https://www.adidas.com',
  puma: 'https://www.puma.com',
  convers: 'https://www.converse.com',
  'h&m': 'https://www.hm.com',
  forever21: 'https://www.forever21.com',
  goat: 'https://www.goat.com',
  vanz: 'https://www.vans.com',
  'fashion nova': 'https://www.fashionnova.com',
  depop: 'https://www.depop.com',
  tiktok: 'https://shop.tiktok.com',
};

function shopLinkFor(name: string): string {
  const key = normName(name);
  return (
    KNOWN_SHOP_LINKS[key] ??
    `https://example.com/${key.replace(/[^a-z0-9]+/g, '-')}`
  );
}

/** Teléfono placeholder determinista (phone_number es único y requerido). */
function placeholderPhone(nameKey: string, taken: Set<string>): string {
  const base = `imp-${createHash('sha1').update(nameKey).digest('hex').slice(0, 10)}`;
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n++}`.slice(0, 20);
  }
  taken.add(candidate);
  return candidate;
}

/** Contraseña inutilizable estilo Django ("!" + aleatorio): no permite login. */
function unusablePassword(): string {
  return `!${randomBytes(20).toString('hex')}`;
}

function toDate(iso: string | null): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

export type RunImportResult =
  | { ok: true; summary: ImportSummary }
  | ActionFailure;

export async function runImportAction(
  payload: unknown
): Promise<RunImportResult> {
  const { denied, user } = await requireRole(IMPORT_ROLES);
  if (denied) return denied;

  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'El payload de importación no es válido.',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const data: ImportPayload = parsed.data;

  const summary: ImportSummary = {
    shopsCreated: 0,
    accountsCreated: 0,
    agentsCreated: 0,
    clientsCreated: 0,
    clientsReused: 0,
    ordersCreated: 0,
    productsCreated: 0,
    receiptsCreated: 0,
    packagesCreated: 0,
    receptionsCreated: 0,
    expensesCreated: 0,
  };

  const importNote = `Importado de ${data.fileName}`;

  try {
    await prisma.$transaction(
      async (tx) => {
        // ------ 1. Tiendas usadas por los artículos/cuentas ------
        const usedStores = new Map<string, string>(); // key → nombre visible
        for (const item of data.items) {
          usedStores.set(normName(item.storeName), item.storeName);
        }
        for (const r of data.receipts) {
          usedStores.set(normName(r.storeName), r.storeName);
        }

        const shopIdByKey = new Map<string, bigint>();
        const existingShops = await tx.shop.findMany({
          select: { id: true, name: true },
        });
        for (const s of existingShops) {
          shopIdByKey.set(normName(s.name), s.id);
        }
        for (const [key, name] of usedStores) {
          if (shopIdByKey.has(key)) continue;
          const created = await tx.shop.create({
            data: { name: clip(name, 100), link: shopLinkFor(name) },
            select: { id: true },
          });
          shopIdByKey.set(key, created.id);
          summary.shopsCreated++;
        }

        // ------ 2. Cuentas de compra (por tienda) ------
        const accountPairs = new Map<string, { name: string; store: string }>();
        for (const src of [...data.items, ...data.receipts]) {
          const store = 'storeName' in src ? src.storeName : null;
          if (src.account && store) {
            accountPairs.set(`${normName(store)}::${normName(src.account)}`, {
              name: src.account,
              store,
            });
          }
        }

        const accountIdByKey = new Map<string, bigint>();
        const existingAccounts = await tx.buyingAccounts.findMany({
          select: {
            id: true,
            accountName: true,
            shop: { select: { name: true } },
          },
        });
        for (const a of existingAccounts) {
          accountIdByKey.set(
            `${normName(a.shop?.name ?? '')}::${normName(a.accountName)}`,
            a.id
          );
        }
        for (const [key, pair] of accountPairs) {
          if (accountIdByKey.has(key)) continue;
          const shopId = shopIdByKey.get(normName(pair.store));
          if (!shopId) continue;
          const created = await tx.buyingAccounts.create({
            data: { accountName: clip(pair.name, 100), shopId },
            select: { id: true },
          });
          accountIdByKey.set(key, created.id);
          summary.accountsCreated++;
        }

        // ------ 3. Usuarios existentes (para agentes y clientes) ------
        const existingUsers = await tx.customUser.findMany({
          select: {
            id: true,
            name: true,
            lastName: true,
            role: true,
            phoneNumber: true,
          },
        });
        const userIdByKey = new Map<string, { id: bigint; role: string }>();
        const takenPhones = new Set<string>();
        for (const u of existingUsers) {
          takenPhones.add(u.phoneNumber);
          const key = normName(`${u.name} ${u.lastName}`.trim());
          if (key && !userIdByKey.has(key)) {
            userIdByKey.set(key, { id: u.id, role: u.role });
          }
        }

        const splitName = (full: string): { name: string; lastName: string } => {
          const parts = full.trim().split(/\s+/);
          return {
            name: clip(parts[0] ?? full, 100),
            lastName: clip(parts.slice(1).join(' '), 100),
          };
        };

        // ------ 4. Agentes ------
        const agentByName = new Map<string, { id: bigint; role: string }>();
        for (const agent of data.agents) {
          const key = normName(agent.name);
          let entry = userIdByKey.get(key);
          if (!entry) {
            const created = await tx.customUser.create({
              data: {
                ...splitName(agent.name),
                password: unusablePassword(),
                phoneNumber: placeholderPhone(`agent:${key}`, takenPhones),
                homeAddress: '',
                role: 'agent',
              },
              select: { id: true },
            });
            entry = { id: created.id, role: 'agent' };
            userIdByKey.set(key, entry);
            summary.agentsCreated++;
          }
          agentByName.set(key, entry);
        }

        // ------ 5. Clientes ------
        const clientByKey = new Map<
          string,
          { id: bigint; agentKey: string | null }
        >();
        for (const client of data.clients) {
          const key = normName(client.name);
          if (clientByKey.has(key)) continue;
          const agentKey = client.agent ? normName(client.agent) : null;

          if (client.mode === 'existing' && client.existingId) {
            const id = parseId(client.existingId);
            if (id != null) {
              clientByKey.set(key, { id, agentKey });
              summary.clientsReused++;
              continue;
            }
          }

          const already = userIdByKey.get(key);
          if (already) {
            clientByKey.set(key, { id: already.id, agentKey });
            summary.clientsReused++;
            continue;
          }

          const agentEntry = agentKey ? agentByName.get(agentKey) : null;
          const created = await tx.customUser.create({
            data: {
              ...splitName(client.name),
              password: unusablePassword(),
              phoneNumber: placeholderPhone(`client:${key}`, takenPhones),
              homeAddress: '',
              role: 'client',
              assignedAgentId:
                agentEntry && ['agent', 'admin'].includes(agentEntry.role)
                  ? agentEntry.id
                  : null,
            },
            select: { id: true },
          });
          clientByKey.set(key, { id: created.id, agentKey });
          userIdByKey.set(key, { id: created.id, role: 'client' });
          summary.clientsCreated++;
        }

        // ------ 6. Recibos de compra (pedidos reales + agrupaciones) ------
        const usedGroupKeys = new Set(
          data.items.map((i) => i.groupKey).filter(Boolean) as string[]
        );
        // shoppingAccount es obligatorio en el modelo: los grupos sin
        // cuenta usan una cuenta genérica "Sin cuenta" por tienda, para
        // que ningún producto quede fuera de su compra.
        const FALLBACK_ACCOUNT = 'Sin cuenta';
        const accountIdFor = async (
          storeKey: string,
          shopId: bigint,
          account: string | null
        ): Promise<bigint> => {
          if (account) {
            const found = accountIdByKey.get(
              `${storeKey}::${normName(account)}`
            );
            if (found) return found;
          }
          const fallbackKey = `${storeKey}::${normName(FALLBACK_ACCOUNT)}`;
          let id = accountIdByKey.get(fallbackKey);
          if (!id) {
            const created = await tx.buyingAccounts.create({
              data: { accountName: FALLBACK_ACCOUNT, shopId },
              select: { id: true },
            });
            id = created.id;
            accountIdByKey.set(fallbackKey, id);
            summary.accountsCreated++;
          }
          return id;
        };

        const receiptIdByKey = new Map<string, bigint>();
        for (const receipt of data.receipts) {
          if (!usedGroupKeys.has(receipt.key)) continue;
          const storeKey = normName(receipt.storeName);
          const shopId = shopIdByKey.get(storeKey);
          if (!shopId) continue;
          const accountId = await accountIdFor(
            storeKey,
            shopId,
            receipt.account
          );
          const total = receipt.realCost ?? receipt.declaredValue ?? 0;
          const created = await tx.shoppingReceip.create({
            data: {
              shopOfBuyId: shopId,
              shoppingAccountId: accountId,
              statusOfShopping: total > 0 ? 'Pagado' : 'No pagado',
              buyDate: toDate(receipt.buyDate),
              totalCostOfPurchase: total,
              cardId: receipt.storeOrderId
                ? `Pedido ${receipt.storeOrderId}`
                : null,
            },
            select: { id: true },
          });
          receiptIdByKey.set(receipt.key, created.id);
          summary.receiptsCreated++;
        }

        // ------ 7. Paquetes (por ID de paquete + número de rastreo) ------
        // La identidad de un paquete es la pareja (etiqueta "ID Paquete",
        // rastreo): filas con la misma pareja caen en el mismo paquete.
        interface PkgInfo {
          label: string | null;
          tracking: string | null;
          store: string;
          arrival: string | null;
        }
        const pkgKeyOf = (i: {
          packageLabel: string | null;
          tracking: string | null;
        }): string | null =>
          i.packageLabel || i.tracking
            ? `${i.packageLabel ? normName(i.packageLabel) : ''}::${i.tracking ?? ''}`
            : null;

        const packages = new Map<string, PkgInfo>();
        for (const item of data.items) {
          const key = pkgKeyOf(item);
          if (!key) continue;
          const prev = packages.get(key);
          if (!prev) {
            packages.set(key, {
              label: item.packageLabel,
              tracking: item.tracking,
              store: item.storeName,
              arrival: item.arrivalDate,
            });
          } else if (!prev.arrival && item.arrivalDate) {
            prev.arrival = item.arrivalDate;
          }
        }

        // numberOfTracking es único: combina etiqueta y rastreo; si solo
        // hay etiqueta, se antepone el número de embarque para distinguir
        // el "#9" de un embarque del "#9" de otro.
        const trackingNumberOf = (p: PkgInfo): string => {
          if (p.label && p.tracking) {
            return clip(`${p.label} · ${p.tracking}`, 100);
          }
          if (p.tracking) return clip(p.tracking, 100);
          return clip(
            `${data.shipmentTag ?? data.fileName} · ${p.label}`,
            100
          );
        };

        const packageIdByKey = new Map<string, bigint>();
        if (packages.size > 0) {
          const numbers = [...packages.values()].map(trackingNumberOf);
          const existingPackages = await tx.package.findMany({
            where: { numberOfTracking: { in: numbers } },
            select: { id: true, numberOfTracking: true },
          });
          const idByNumber = new Map(
            existingPackages.map((p) => [p.numberOfTracking, p.id])
          );
          for (const [key, info] of packages) {
            const number = trackingNumberOf(info);
            let id = idByNumber.get(number);
            if (!id) {
              const created = await tx.package.create({
                data: {
                  agencyName: clip(info.store, 100),
                  numberOfTracking: number,
                  statusOfProcessing: info.arrival ? 'Recibido' : 'Enviado',
                  arrivalDate: toDate(info.arrival),
                },
                select: { id: true },
              });
              id = created.id;
              idByNumber.set(number, id);
              summary.packagesCreated++;
            }
            packageIdByKey.set(key, id);
          }
        }

        // ------ 8. Órdenes (una por cliente con artículos) ------
        const itemsByClient = new Map<string, typeof data.items>();
        for (const item of data.items) {
          const key = normName(item.client);
          if (!clientByKey.has(key)) continue; // cliente excluido de la importación
          const list = itemsByClient.get(key) ?? [];
          list.push(item);
          itemsByClient.set(key, list);
        }

        const productRows: Prisma.ProductCreateManyInput[] = [];
        const buyRows: Prisma.ProductBuyedCreateManyInput[] = [];
        const receivedRows: Prisma.ProductReceivedCreateManyInput[] = [];

        for (const [clientKey, items] of itemsByClient) {
          const client = clientByKey.get(clientKey)!;
          const agentEntry = client.agentKey
            ? agentByName.get(client.agentKey)
            : null;
          const salesManagerId =
            agentEntry && ['agent', 'admin'].includes(agentEntry.role)
              ? agentEntry.id
              : null;

          let orderTotal = 0;
          const order = await tx.order.create({
            data: {
              clientId: client.id,
              salesManagerId,
              status: 'Procesando',
              payStatus: 'No pagado',
              observations: importNote,
            },
            select: { id: true },
          });
          summary.ordersCreated++;

          for (const item of items) {
            const shopId = shopIdByKey.get(normName(item.storeName));
            if (!shopId) continue;
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
            orderTotal += cost.totalCost;

            // Un producto empaquetado (etiqueta o rastreo) ya llegó al
            // almacén aunque la fila no traiga fecha de llegada.
            const pkgKey = pkgKeyOf(item);
            const received =
              item.arrivalDate || pkgKey ? item.quantity : 0;
            const productId = randomUUID();
            const name =
              item.description ??
              (item.sku ? `SKU ${item.sku}` : `Artículo ${item.storeName}`);
            const observationParts = [
              `${importNote} · ${item.sheet} fila ${item.rowNumber}`,
            ];
            if (item.packageLabel) {
              observationParts.push(`Paquete ${item.packageLabel}`);
            }

            productRows.push({
              id: productId,
              name: clip(name, 100),
              sku: item.sku ? clip(item.sku, 100) : null,
              shopId,
              orderId: order.id,
              description: item.description
                ? clip(item.description, 200)
                : null,
              observation: clip(observationParts.join(' · '), 200),
              amountRequested: item.quantity,
              amountPurchased: item.quantity,
              amountReceived: received,
              amountDelivered: 0,
              status: received > 0 ? 'Recibido' : 'Comprado',
              shopCost: item.unitValue ?? 0,
              shopDeliveryCost: 0,
              shopTaxes,
              chargeIva: true,
              baseTax: cost.baseTax,
              shopTaxAmount: cost.shopTaxAmount,
              ownTaxes: 0,
              addedTaxes: 0,
              totalCost: cost.totalCost,
            });

            buyRows.push({
              originalProductId: productId,
              amountBuyed: item.quantity,
              buyDate: toDate(item.buyDate),
              shopingReceipId: item.groupKey
                ? (receiptIdByKey.get(item.groupKey) ?? null)
                : null,
            });

            if (received > 0) {
              receivedRows.push({
                originalProductId: productId,
                amountReceived: received,
                packageId: pkgKey
                  ? (packageIdByKey.get(pkgKey) ?? null)
                  : null,
                observation: clip(importNote, 200),
              });
            }
          }

          const totalCosts = Math.round(orderTotal * 100) / 100;
          await tx.order.update({
            where: { id: order.id },
            data: {
              totalCosts,
              payStatus: computePayStatus(totalCosts, 0, 0),
            },
          });
        }

        if (productRows.length > 0) {
          await tx.product.createMany({ data: productRows });
          summary.productsCreated = productRows.length;
        }
        if (buyRows.length > 0) {
          await tx.productBuyed.createMany({ data: buyRows });
        }
        if (receivedRows.length > 0) {
          await tx.productReceived.createMany({ data: receivedRows });
          summary.receptionsCreated = receivedRows.length;
        }

        // ------ 9. Balances de los clientes afectados ------
        for (const clientKey of itemsByClient.keys()) {
          await recalculateClientBalance(clientByKey.get(clientKey)!.id, tx);
        }

        // ------ 10. Gastos del período ------
        if (data.expenses.length > 0) {
          const createdById = parseId(user.id);
          await tx.expense.createMany({
            data: data.expenses.map((e) => ({
              amount: e.amount,
              category: (EXPENSE_CATEGORIES as readonly string[]).includes(
                e.category
              )
                ? e.category
                : 'Otro',
              description: clip(`${e.label} (${importNote})`, 500),
              createdById,
            })),
          });
          summary.expensesCreated = data.expenses.length;
        }
      },
      { timeout: 300_000, maxWait: 20_000 }
    );
  } catch (err) {
    console.error('[import] run failed', err);
    return {
      ok: false,
      error:
        'La importación falló y no se guardó ningún dato (transacción revertida). Revisa el archivo o inténtalo de nuevo.',
    };
  }

  for (const path of [
    '/orders',
    '/products',
    '/purchases',
    '/packages',
    '/users',
    '/shops',
    '/expenses',
    '/dashboard',
  ]) {
    revalidatePath(path);
  }

  return { ok: true, summary };
}
