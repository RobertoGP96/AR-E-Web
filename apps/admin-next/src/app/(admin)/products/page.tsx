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

const DATE_BY = ['encargo', 'compra'] as const;
type DateBy = (typeof DATE_BY)[number];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    shop?: string;
    client?: string;
    min?: string;
    max?: string;
    dateBy?: string;
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

/** Valida un precio ≥ 0 de la URL. */
function parsePriceParam(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const {
    q,
    status,
    shop,
    client,
    min,
    max,
    dateBy,
    from,
    to,
    page: pageParam,
    per,
  } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (PRODUCT_STATUSES as readonly string[]).includes(status)
      ? (status as ProductStatus)
      : null;
  const shopFilter = shop && /^\d+$/.test(shop) ? BigInt(shop) : null;
  const clientFilter = client && /^\d+$/.test(client) ? BigInt(client) : null;
  const minFilter = parsePriceParam(min);
  const maxFilter = parsePriceParam(max);
  const dateByFilter: DateBy =
    dateBy && (DATE_BY as readonly string[]).includes(dateBy)
      ? (dateBy as DateBy)
      : 'encargo';
  const fromFilter = parseDateParam(from);
  const toFilter = parseDateParam(to);

  const dateRange =
    fromFilter || toFilter
      ? {
          ...(fromFilter && { gte: new Date(`${fromFilter}T00:00:00`) }),
          ...(toFilter && { lte: new Date(`${toFilter}T23:59:59.999`) }),
        }
      : null;

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where: Prisma.ProductWhereInput = {
    ...(statusFilter && { status: statusFilter }),
    ...(shopFilter && { shopId: shopFilter }),
    ...(clientFilter && { order: { clientId: clientFilter } }),
    ...((minFilter !== null || maxFilter !== null) && {
      totalCost: {
        ...(minFilter !== null && { gte: minFilter }),
        ...(maxFilter !== null && { lte: maxFilter }),
      },
    }),
    // "Encargo" filtra por la fecha en que se pidió el producto;
    // "compra" por la fecha real de compra en la tienda (ProductBuyed).
    ...(dateRange &&
      (dateByFilter === 'compra'
        ? { buys: { some: { buyDate: dateRange } } }
        : { createdAt: dateRange })),
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

  const [products, shops, clients, priceAgg, totalCount] = await Promise.all([
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
    prisma.customUser.findMany({
      where: { role: 'client' },
      select: { id: true, name: true, lastName: true, phoneNumber: true },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    prisma.product.aggregate({
      _min: { totalCost: true },
      _max: { totalCost: true },
    }),
    prisma.product.count({ where }),
  ]);

  // Límites globales del slider de precio (no dependen de los filtros
  // activos para que el rango no "salte" al filtrar).
  const priceBounds = {
    min: Math.floor(priceAgg._min.totalCost ?? 0),
    max: Math.ceil(priceAgg._max.totalCost ?? 0),
  };

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
      clientOptions={clients.map((c) => ({
        id: c.id.toString(),
        label: `${c.name} ${c.lastName}`.trim(),
        description: c.phoneNumber,
      }))}
      priceBounds={priceBounds}
      initialFilters={{
        q: search,
        status: statusFilter,
        shop: shopFilter?.toString() ?? null,
        client: clientFilter?.toString() ?? null,
        min: minFilter,
        max: maxFilter,
        dateBy: dateByFilter,
        from: fromFilter,
        to: toFilter,
      }}
    />
    <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
