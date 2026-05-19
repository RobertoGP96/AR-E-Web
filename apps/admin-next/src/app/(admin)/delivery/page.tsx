import { prisma } from '@/lib/prisma';
import { DeliveryClient } from './delivery-client';
import {
  DELIVERY_STATUSES,
  fromDbDeliveryStatus,
  fromDbPayStatus,
  toDbDeliveryStatus,
  type CategoryOption,
  type ClientOption,
  type DbDeliveryStatus,
  type DbPayStatus,
  type DeliveryRow,
  type DeliveryStatus,
} from './schema';

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function DeliveryPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const search = q?.trim() ?? '';
  const statusFilter =
    status && (DELIVERY_STATUSES as readonly string[]).includes(status)
      ? (status as DeliveryStatus)
      : null;

  const [deliveries, clients, categories] = await Promise.all([
    prisma.deliverReceip.findMany({
      where: {
        ...(statusFilter && {
          status: toDbDeliveryStatus(statusFilter),
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
      },
      include: {
        client: { select: { name: true, lastName: true } },
        category: { select: { name: true } },
      },
      orderBy: { deliverDate: 'desc' },
      take: 100,
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
  ]);

  const rows: DeliveryRow[] = deliveries.map((d) => ({
    id: d.id.toString(),
    clientId: d.clientId.toString(),
    clientName: `${d.client.name} ${d.client.lastName}`.trim(),
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
    label: `${c.name} ${c.lastName} · ${c.phoneNumber}`.trim(),
  }));
  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id.toString(),
    label: c.name,
    clientShippingCharge: c.clientShippingCharge,
  }));

  return (
    <DeliveryClient
      initialRows={rows}
      clientOptions={clientOptions}
      categoryOptions={categoryOptions}
      initialFilters={{ q: search, status: statusFilter }}
    />
  );
}
