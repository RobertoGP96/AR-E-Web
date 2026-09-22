import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseId } from '@/lib/action-helpers';
import { deliveryPhase, phaseWhere } from '@/lib/delivery-status';
import { TablePagination } from '@/components/table-pagination';
import { parsePagination } from '@/lib/pagination';
import { DeliveryClient } from '../delivery-client';
import {
  DELIVERY_PHASES,
  PAY_STATUSES,
  fromDbDeliveryStatus,
  fromDbPayStatus,
  toDbPayStatus,
  type DbDeliveryStatus,
  type DbPayStatus,
  type DeliveryPhase,
  type DeliveryRow,
  type PayStatus,
} from '../schema';

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

/**
 * Lista de entregas por fase. Las bolsas abiertas («En preparación») se
 * gestionan en /delivery/prepare y por defecto quedan fuera de la lista;
 * se ven eligiendo esa fase en el filtro.
 */
export default async function DeliveryPage({ searchParams }: PageProps) {
  const { q, status, pay, from, to, page: pageParam, per } = await searchParams;
  const search = q?.trim() ?? '';
  const phaseFilter =
    status && (DELIVERY_PHASES as readonly string[]).includes(status)
      ? (status as DeliveryPhase)
      : null;
  const payFilter =
    pay && (PAY_STATUSES as readonly string[]).includes(pay)
      ? (pay as PayStatus)
      : null;
  const fromFilter = parseDateParam(from);
  const toFilter = parseDateParam(to);

  const session = await auth();
  const role = session?.user?.role ?? '';
  // Un agente solo ve las entregas de sus clientes asignados.
  const agentId = role === 'agent' ? parseId(session?.user?.id ?? '') : null;

  const { page, perPage, skip } = parsePagination({ page: pageParam, per });
  const clientWhere: Prisma.CustomUserWhereInput = {
    ...(agentId !== null && { assignedAgentId: agentId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const where: Prisma.DeliverReceipWhereInput = {
    ...(phaseFilter
      ? (phaseWhere(phaseFilter) as Prisma.DeliverReceipWhereInput)
      : // Sin filtro de fase: todo menos las bolsas abiertas.
        { NOT: { status: 'Pendiente', weight: 0 } }),
    ...(payFilter && { paymentStatus: toDbPayStatus(payFilter) }),
    ...((fromFilter || toFilter) && {
      deliverDate: {
        ...(fromFilter && { gte: new Date(`${fromFilter}T00:00:00`) }),
        ...(toFilter && { lte: new Date(`${toFilter}T23:59:59.999`) }),
      },
    }),
    ...((agentId !== null || search) && { client: clientWhere }),
  };

  const [deliveries, totalCount, openBags] = await Promise.all([
    prisma.deliverReceip.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            lastName: true,
            balance: true,
            assignedAgent: { select: { agentProfit: true } },
          },
        },
        category: { select: { name: true, clientShippingCharge: true } },
        _count: { select: { deliveredProducts: true } },
      },
      orderBy: [{ deliverDate: 'desc' }, { id: 'desc' }],
      skip,
      take: perPage,
    }),
    prisma.deliverReceip.count({ where }),
    prisma.deliverReceip.count({
      where: {
        status: 'Pendiente',
        weight: 0,
        ...(agentId !== null && { client: { assignedAgentId: agentId } }),
      },
    }),
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
    phase: deliveryPhase({ status: d.status, weight: d.weight }),
    paymentStatus: fromDbPayStatus(d.paymentStatus as DbPayStatus),
    weightCost: d.weightCost,
    managerProfit: d.managerProfit,
    paymentAmount: d.paymentAmount,
    balanceApplied: d.balanceApplied,
    deliverDate: d.deliverDate.toISOString(),
    deliverPicture: d.deliverPicture,
    productCount: d._count.deliveredProducts,
    chargePerLb: d.category?.clientShippingCharge ?? 0,
    agentProfit: d.client.assignedAgent?.agentProfit ?? 0,
  }));

  return (
    <>
      <DeliveryClient
        initialRows={rows}
        role={role}
        openBagCount={openBags}
        initialFilters={{
          q: search,
          status: phaseFilter,
          pay: payFilter,
          from: fromFilter,
          to: toFilter,
        }}
      />
      <TablePagination page={page} perPage={perPage} total={totalCount} />
    </>
  );
}
