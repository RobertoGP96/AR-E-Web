import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ProductsClient } from './products-client';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';

const PRODUCT_STATUSES = [
  'Encargado',
  'Comprado',
  'Recibido',
  'Entregado',
] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    shop?: string;
    page?: string;
    per?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, status, shop, page: pageParam, per } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (PRODUCT_STATUSES as readonly string[]).includes(status)
      ? (status as ProductStatus)
      : null;
  const shopFilter = shop && /^\d+$/.test(shop) ? BigInt(shop) : null;

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where: Prisma.ProductWhereInput = {
    ...(statusFilter && { status: statusFilter }),
    ...(shopFilter && { shopId: shopFilter }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        {
          order: {
            client: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ],
    }),
  };

  const [products, shops, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        shop: { select: { name: true } },
        order: {
          select: {
            id: true,
            client: { select: { name: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <>
    <ProductsClient
      initialRows={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        shopName: p.shop.name,
        orderId: p.order.id.toString(),
        clientName:
          `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        status: p.status as ProductStatus,
        amountRequested: p.amountRequested,
        amountPurchased: p.amountPurchased,
        amountReceived: p.amountReceived,
        amountDelivered: p.amountDelivered,
        totalCost: p.totalCost,
        link: p.link,
      }))}
      shopOptions={shops.map((s) => ({
        id: s.id.toString(),
        label: s.name,
      }))}
      initialFilters={{
        q: search,
        status: statusFilter,
        shop: shopFilter?.toString() ?? null,
      }}
    />
    <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
