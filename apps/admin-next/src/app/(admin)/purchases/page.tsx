import { prisma } from '@/lib/prisma';
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
  searchParams: Promise<{ status?: string }>;
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const statusFilter =
    status && (PAY_STATUSES as readonly string[]).includes(status)
      ? (status as PayStatus)
      : null;

  const [receipts, shops] = await Promise.all([
    prisma.shoppingReceip.findMany({
      where: statusFilter
        ? { statusOfShopping: toDbPayStatus(statusFilter) }
        : undefined,
      include: {
        shopOfBuy: { select: { name: true } },
        shoppingAccount: { select: { accountName: true } },
        _count: { select: { buyedProducts: true } },
      },
      orderBy: { buyDate: 'desc' },
      take: 100,
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
    <PurchasesClient
      initialRows={rows}
      shopOptions={shopOptions}
      initialStatus={statusFilter}
    />
  );
}
