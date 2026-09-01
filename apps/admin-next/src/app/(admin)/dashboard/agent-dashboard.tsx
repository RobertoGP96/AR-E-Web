import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { StatCard } from '@/components/ui';
import {
  DeliveryStatusBadge,
  PayStatusBadge,
} from '@/components/status-badges';
import { formatDate } from '@/lib/format';
import {
  AlertCircle,
  ClipboardList,
  CreditCard,
  Package2,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DashboardHeading,
  ListCard,
  ListEmpty,
  QuickActions,
  RowLink,
  SectionTitle,
  StatLink,
  fmtMoney,
  type QuickAction,
} from './components';

const ACTIONS: readonly QuickAction[] = [
  {
    href: '/orders',
    icon: ShoppingCart,
    title: 'Órdenes',
    description: 'Crear y gestionar pedidos de tus clientes',
  },
  {
    href: '/products',
    icon: Package2,
    title: 'Productos',
    description: 'Estado de compra y recepción del catálogo',
  },
  {
    href: '/delivery',
    icon: Truck,
    title: 'Entregas',
    description: 'Seguimiento de las entregas en curso',
  },
  {
    href: '/delivery/prepare',
    icon: ClipboardList,
    title: 'Mercancía lista',
    description: 'Qué está listo para entregar por cliente',
  },
];

/**
 * Dashboard del rol agente: su cartera de clientes asignados, sus
 * órdenes gestionadas, las comisiones que generan sus entregas y qué
 * clientes suyos tienen entregas por recoger.
 */
export async function AgentDashboard({
  role,
  agentId,
}: {
  role: string;
  agentId: bigint;
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    clientCount,
    debtAgg,
    activeOrdersCount,
    unpaidOrdersAgg,
    commissionTotalAgg,
    commissionMonthAgg,
    pendingDeliveriesCount,
    pendingDeliveries,
    readyProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.customUser.count({ where: { assignedAgentId: agentId } }),
    prisma.customUser.aggregate({
      where: { assignedAgentId: agentId, balance: { lt: 0 } },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: {
        salesManagerId: agentId,
        status: { in: ['Encargado', 'Procesando'] },
      },
    }),
    prisma.order.aggregate({
      where: { salesManagerId: agentId, payStatus: { not: 'Pagado' } },
      _count: { _all: true },
      _sum: {
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
      },
    }),
    prisma.deliverReceip.aggregate({
      where: { client: { assignedAgentId: agentId } },
      _sum: { managerProfit: true },
    }),
    prisma.deliverReceip.aggregate({
      where: {
        client: { assignedAgentId: agentId },
        deliverDate: { gte: monthStart },
      },
      _sum: { managerProfit: true },
    }),
    prisma.deliverReceip.count({
      where: {
        status: { in: ['Pendiente', 'En transito'] },
        client: { assignedAgentId: agentId },
      },
    }),
    prisma.deliverReceip.findMany({
      where: {
        status: { in: ['Pendiente', 'En transito'] },
        client: { assignedAgentId: agentId },
      },
      select: {
        id: true,
        status: true,
        weight: true,
        weightCost: true,
        managerProfit: true,
        deliverDate: true,
        client: { select: { name: true, lastName: true, phoneNumber: true } },
      },
      orderBy: { deliverDate: 'asc' },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        amountReceived: { gt: 0 },
        order: { client: { assignedAgentId: agentId } },
      },
      select: {
        amountReceived: true,
        amountDelivered: true,
        order: { select: { clientId: true } },
      },
      take: 1000,
    }),
    prisma.order.findMany({
      where: { salesManagerId: agentId },
      select: {
        id: true,
        status: true,
        payStatus: true,
        totalCosts: true,
        createdAt: true,
        client: { select: { name: true, lastName: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  // Mercancía recibida sin entregar de los clientes de este agente.
  let readyUnits = 0;
  const readyClientIds = new Set<string>();
  for (const p of readyProducts) {
    const ready = p.amountReceived - p.amountDelivered;
    if (ready <= 0) continue;
    readyUnits += ready;
    readyClientIds.add(p.order.clientId.toString());
  }

  const outstandingOrders = Math.max(
    0,
    round2(
      (unpaidOrdersAgg._sum.totalCosts ?? 0) -
        (unpaidOrdersAgg._sum.receivedValueOfClient ?? 0) -
        (unpaidOrdersAgg._sum.balanceApplied ?? 0)
    )
  );

  const myOrdersHref = `/orders?manager=${agentId}`;
  const myUnpaidOrdersHref = `/orders?manager=${agentId}&pay=${encodeURIComponent('No pagado')}`;

  return (
    <section className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-700">
      <DashboardHeading
        title="Mi Panel de Agente"
        subtitle="Tu cartera de clientes, tus órdenes y las comisiones de tus entregas"
      />
      <hr className="my-4 border-separator" />

      <div className="space-y-3">
        <SectionTitle label="Atajos" />
        <QuickActions role={role} actions={ACTIONS} />
      </div>

      <div className="space-y-3">
        <SectionTitle label="Mi Cartera" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Clientes Asignados"
            value={clientCount.toLocaleString()}
            tone="accent"
          />
          <StatCard
            icon={AlertCircle}
            label="Clientes con Deuda"
            value={debtAgg._count._all.toLocaleString()}
            hint={`${fmtMoney(Math.abs(debtAgg._sum.balance ?? 0))} en deudas`}
            tone="danger"
          />
          <StatLink role={role} href={myOrdersHref}>
            <StatCard
              icon={ShoppingCart}
              label="Órdenes Activas"
              value={activeOrdersCount.toLocaleString()}
              hint="Encargadas o procesando"
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href={myUnpaidOrdersHref}>
            <StatCard
              icon={CreditCard}
              label="Por Cobrar en Órdenes"
              value={fmtMoney(outstandingOrders)}
              hint={`${unpaidOrdersAgg._count._all} órdenes sin saldar`}
              tone="warning"
            />
          </StatLink>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Comisiones y Entregas" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Comisión Total"
            value={fmtMoney(commissionTotalAgg._sum.managerProfit ?? 0)}
            hint="Histórico de tus entregas"
            tone="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Comisión del Mes"
            value={fmtMoney(commissionMonthAgg._sum.managerProfit ?? 0)}
            tone="success"
          />
          <StatLink role={role} href="/delivery?status=Pendiente">
            <StatCard
              icon={Truck}
              label="Entregas por Recoger"
              value={pendingDeliveriesCount.toLocaleString()}
              hint="De tus clientes"
              tone="warning"
            />
          </StatLink>
          <StatLink role={role} href="/delivery/prepare">
            <StatCard
              icon={PackageCheck}
              label="Mercancía Lista"
              value={`${readyUnits.toLocaleString()} uds`}
              hint={`${readyClientIds.size} clientes por avisar`}
              tone="accent"
            />
          </StatLink>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard
          icon={Truck}
          title="Entregas por recoger de mis clientes"
          hint="Pendientes o en tránsito — avísales"
          viewAll={{ href: '/delivery', label: 'Ver todas' }}
        >
          {pendingDeliveries.length === 0 ? (
            <ListEmpty
              icon={Truck}
              message="Tus clientes no tienen entregas pendientes"
            />
          ) : (
            pendingDeliveries.map((d) => (
              <RowLink key={d.id.toString()} href={`/delivery/${d.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {`${d.client.name} ${d.client.lastName}`.trim()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {d.client.phoneNumber} · {formatDate(d.deliverDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {fmtMoney(d.weightCost)}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-success">
                      +{fmtMoney(d.managerProfit)} comisión
                    </p>
                  </div>
                  <span className="hidden sm:block">
                    <DeliveryStatusBadge status={d.status} />
                  </span>
                </div>
              </RowLink>
            ))
          )}
        </ListCard>

        <ListCard
          icon={ShoppingCart}
          title="Mis órdenes recientes"
          hint="Las últimas órdenes que gestionas"
          viewAll={{ href: myOrdersHref, label: 'Ver todas' }}
        >
          {recentOrders.length === 0 ? (
            <ListEmpty
              icon={ShoppingCart}
              message="Aún no gestionas ninguna orden"
            />
          ) : (
            recentOrders.map((o) => (
              <RowLink key={o.id.toString()} href={`/orders/${o.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {`${o.client.name} ${o.client.lastName}`.trim()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(o.createdAt)} · {o._count.products}{' '}
                    {o._count.products === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {fmtMoney(o.totalCosts)}
                  </p>
                  <span className="hidden sm:block">
                    <PayStatusBadge status={o.payStatus} />
                  </span>
                </div>
              </RowLink>
            ))
          )}
        </ListCard>
      </div>
    </section>
  );
}
