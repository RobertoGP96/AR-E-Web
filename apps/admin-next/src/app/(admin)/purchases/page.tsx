import { prisma } from '@/lib/prisma';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { PurchasesClient } from './purchases-client';
import {
  PAY_STATUSES,
  fromDbPayStatus,
  toDbPayStatus,
  type DbPayStatus,
  type PayStatus,
  type PurchaseRow,
  type ShopWithAccounts,
} from './schema';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    shop?: string;
    from?: string;
    to?: string;
    page?: string;
    per?: string;
  }>;
}

/** Valida un parámetro YYYY-MM-DD de la URL; cualquier otra cosa se ignora. */
function parseDateParam(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? null : value;
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  const { status, shop, from, to, page: pageParam, per } = await searchParams;
  const statusFilter =
    status && (PAY_STATUSES as readonly string[]).includes(status)
      ? (status as PayStatus)
      : null;
  const shopFilter = shop && /^\d+$/.test(shop) ? BigInt(shop) : null;
  const fromFilter = parseDateParam(from);
  const toFilter = parseDateParam(to);

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where = {
    ...(statusFilter && { statusOfShopping: toDbPayStatus(statusFilter) }),
    ...(shopFilter && { shopOfBuyId: shopFilter }),
    ...((fromFilter || toFilter) && {
      buyDate: {
        ...(fromFilter && { gte: new Date(`${fromFilter}T00:00:00`) }),
        ...(toFilter && { lte: new Date(`${toFilter}T23:59:59.999`) }),
      },
    }),
  };

  const [receipts, shops, totalCount] = await Promise.all([
    prisma.shoppingReceip.findMany({
      where,
      include: {
        shopOfBuy: { select: { name: true } },
        shoppingAccount: { select: { accountName: true } },
        _count: { select: { buyedProducts: true } },
      },
      orderBy: { buyDate: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.shop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        buyingAccounts: { select: { id: true, accountName: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.shoppingReceip.count({ where }),
  ]);

  const rows: PurchaseRow[] = receipts.map((r) => ({
    id: r.id.toString(),
    shopOfBuyId: r.shopOfBuyId.toString(),
    shopName: r.shopOfBuy.name,
    shoppingAccountId: r.shoppingAccountId.toString(),
    accountName: r.shoppingAccount.accountName,
    statusOfShopping: fromDbPayStatus(
      r.statusOfShopping as DbPayStatus
    ),
    cardId: r.cardId,
    buyDate: r.buyDate.toISOString(),
    totalCostOfPurchase: r.totalCostOfPurchase,
    productCount: r._count.buyedProducts,
  }));

  const shopOptions: ShopWithAccounts[] = shops.map((s) => ({
    id: s.id.toString(),
    label: s.name,
    accounts: s.buyingAccounts.map((a) => ({
      id: a.id.toString(),
      label: a.accountName,
    })),
  }));

  return (
    <>
      <PurchasesClient
        initialRows={rows}
        shopOptions={shopOptions}
        initialFilters={{
          status: statusFilter,
          shop: shopFilter?.toString() ?? null,
          from: fromFilter,
          to: toFilter,
        }}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
