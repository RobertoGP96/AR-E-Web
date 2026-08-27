import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { DeliveryClient } from './delivery-client';
import {
  DELIVERY_STATUSES,
  PAY_STATUSES,
  fromDbDeliveryStatus,
  fromDbPayStatus,
  toDbDeliveryStatus,
  toDbPayStatus,
  type CategoryOption,
  type ClientOption,
  type DbDeliveryStatus,
  type DbPayStatus,
  type DeliveryRow,
  type DeliveryStatus,
  type PayStatus,
} from './schema';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    pay?: string;
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

export default async function DeliveryPage({ searchParams }: PageProps) {
  const { q, status, pay, from, to, page: pageParam, per } =
    await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (DELIVERY_STATUSES as readonly string[]).includes(status)
      ? (status as DeliveryStatus)
      : null;
  const payFilter =
    pay && (PAY_STATUSES as readonly string[]).includes(pay)
      ? (pay as PayStatus)
      : null;
  const fromFilter = parseDateParam(from);
  const toFilter = parseDateParam(to);

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const where: Prisma.DeliverReceipWhereInput = {
    ...(statusFilter && {
      status: toDbDeliveryStatus(statusFilter),
    }),
    ...(payFilter && { paymentStatus: toDbPayStatus(payFilter) }),
    ...((fromFilter || toFilter) && {
      deliverDate: {
        ...(fromFilter && { gte: new Date(`${fromFilter}T00:00:00`) }),
        ...(toFilter && { lte: new Date(`${toFilter}T23:59:59.999`) }),
      },
    }),
    ...(search && {
      client: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
  };

  const [deliveries, clients, categories, totalCount] = await Promise.all([
    prisma.deliverReceip.findMany({
      where,
      include: {
        client: { select: { name: true, lastName: true, balance: true } },
        category: { select: { name: true } },
      },
      orderBy: { deliverDate: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.customUser.findMany({
      where: { role: 'client' },
      select: { id: true, name: true, lastName: true, phoneNumber: true },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    prisma.category.findMany({
      select: { id: true, name: true, clientShippingCharge: true },
      orderBy: { name: 'asc' },
    }),
    prisma.deliverReceip.count({ where }),
  ]);

  const rows: DeliveryRow[] = deliveries.map((d) => ({
    id: d.id.toString(),
    clientId: d.clientId.toString(),
    clientName: `${d.client.name} ${d.client.lastName}`.trim(),
    clientBalance: d.client.balance,
    categoryId: d.categoryId ? d.categoryId.toString() : null,
    categoryName: d.category?.name ?? null,
    weight: d.weight,
    status: fromDbDeliveryStatus(d.status as DbDeliveryStatus),
    paymentStatus: fromDbPayStatus(d.paymentStatus as DbPayStatus),
    weightCost: d.weightCost,
    managerProfit: d.managerProfit,
    paymentAmount: d.paymentAmount,
    balanceApplied: d.balanceApplied,
    deliverDate: d.deliverDate.toISOString(),
    deliverPicture: d.deliverPicture,
  }));

  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id.toString(),
    label: `${c.name} ${c.lastName}`.trim(),
    phoneNumber: c.phoneNumber,
  }));
  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id.toString(),
    label: c.name,
    clientShippingCharge: c.clientShippingCharge,
  }));

  return (
    <>
      <DeliveryClient
        initialRows={rows}
        clientOptions={clientOptions}
        categoryOptions={categoryOptions}
        initialFilters={{
          q: search,
          status: statusFilter,
          pay: payFilter,
          from: fromFilter,
          to: toFilter,
        }}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
