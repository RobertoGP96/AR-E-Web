import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/ui';
import { DeliveryStatusBadge } from '@/components/status-badges';
import { formatDate } from '@/lib/format';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Banknote,
  Package,
  Package2,
  PackageCheck,
  Truck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  DashboardHeading,
  ListCard,
  ListEmpty,
  QuickActions,
  Row,
  RowLink,
  SectionTitle,
  StatLink,
  fmtMoney,
  type QuickAction,
} from './components';

const ACTIONS: readonly QuickAction[] = [
  {
    href: '/delivery/prepare',
    icon: ClipboardList,
    title: 'Preparar entregas',
    description: 'Revisar paquetes y armar entregas por cliente',
  },
  {
    href: '/delivery',
    icon: Truck,
    title: 'Entregas',
    description: 'Estado, pagos y seguimiento de cada entrega',
  },
  {
    href: '/packages',
    icon: Package,
    title: 'Paquetes',
    description: 'Trackings, llegadas y estados de proceso',
  },
  {
    href: '/products',
    icon: Package2,
    title: 'Productos',
    description: 'Pipeline de compra, recepción y entrega',
  },
];

/**
 * Dashboard del rol logístico (mensajero): su día en entregas,
 * cobros pendientes, paquetes por revisar y qué clientes ya tienen
 * mercancía lista para recoger.
 */
export async function LogisticalDashboard({ role }: { role: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const [
    todayCount,
    pendingCount,
    transitCount,
    failedCount,
    deliveredMonthAgg,
    profitMonthAgg,
    collectedMonthAgg,
    unpaidAgg,
    packagesInTransit,
    packagesToReview,
    readyProducts,
    recentDeliveries,
  ] = await Promise.all([
    prisma.deliverReceip.count({
      where: { deliverDate: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.deliverReceip.count({ where: { status: 'Pendiente' } }),
    prisma.deliverReceip.count({ where: { status: 'En transito' } }),
    prisma.deliverReceip.count({ where: { status: 'Fallida' } }),
    prisma.deliverReceip.aggregate({
      where: { status: 'Entregado', deliverDate: { gte: monthStart } },
      _count: { _all: true },
      _sum: { weight: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { deliverDate: { gte: monthStart } },
      _sum: { managerProfit: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { paymentDate: { gte: monthStart } },
      _sum: { paymentAmount: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { paymentStatus: { not: 'Pagado' } },
      _sum: { weightCost: true, paymentAmount: true },
      _count: { _all: true },
    }),
    prisma.package.count({ where: { statusOfProcessing: 'Enviado' } }),
    prisma.package.count({ where: { statusOfProcessing: 'Recibido' } }),
    prisma.product.findMany({
      where: { amountReceived: { gt: 0 } },
      select: {
        amountReceived: true,
        amountDelivered: true,
        order: {
          select: {
            clientId: true,
            client: {
              select: { name: true, lastName: true, phoneNumber: true },
            },
          },
        },
      },
      take: 1000,
    }),
    prisma.deliverReceip.findMany({
      select: {
        id: true,
        weight: true,
        weightCost: true,
        managerProfit: true,
        status: true,
        deliverDate: true,
        client: { select: { name: true, lastName: true } },
      },
      orderBy: { deliverDate: 'desc' },
      take: 6,
    }),
  ]);

  // Clientes con mercancía recibida sin entregar (misma base que la
  // fase «Armar entregas» de /delivery/prepare).
  const readyByClient = new Map<
    string,
    { name: string; phone: string; readyUnits: number; productCount: number }
  >();
  for (const p of readyProducts) {
    const ready = p.amountReceived - p.amountDelivered;
    if (ready <= 0) continue;
    const key = p.order.clientId.toString();
    const entry = readyByClient.get(key);
    if (entry) {
      entry.readyUnits += ready;
      entry.productCount += 1;
    } else {
      readyByClient.set(key, {
        name: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        phone: p.order.client.phoneNumber,
        readyUnits: ready,
        productCount: 1,
      });
    }
  }
  const readyClients = [...readyByClient.values()].sort(
    (a, b) => b.readyUnits - a.readyUnits || a.name.localeCompare(b.name)
  );
  const totalReadyUnits = readyClients.reduce(
    (sum, c) => sum + c.readyUnits,
    0
  );

  const unpaidAmount = Math.max(
    0,
    (unpaidAgg._sum.weightCost ?? 0) - (unpaidAgg._sum.paymentAmount ?? 0)
  );
  const transitHref = `/delivery?status=${encodeURIComponent('En transito')}`;
  const unpaidHref = `/delivery?pay=${encodeURIComponent('No pagado')}`;

  return (
    <section className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-700">
      <DashboardHeading
        title="Mi Panel de Logística"
        subtitle="Tu día de trabajo: entregas, cobros, paquetes y mercancía lista para salir"
      />
      <hr className="my-4 border-separator" />

      <div className="space-y-3">
        <SectionTitle label="Atajos" />
        <QuickActions role={role} actions={ACTIONS} />
      </div>

      <div className="space-y-3">
        <SectionTitle label="Entregas" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href="/delivery">
            <StatCard
              icon={CalendarClock}
              label="Entregas de Hoy"
              value={todayCount.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/delivery?status=Pendiente">
            <StatCard
              icon={Clock}
              label="Pendientes"
              value={pendingCount.toLocaleString()}
              hint="Por salir a repartir"
              tone="warning"
            />
          </StatLink>
          <StatLink role={role} href={transitHref}>
            <StatCard
              icon={Truck}
              label="En Tránsito"
              value={transitCount.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/delivery?status=Fallida">
            <StatCard
              icon={XCircle}
              label="Fallidas"
              value={failedCount.toLocaleString()}
              hint={failedCount > 0 ? 'Revisar y reprogramar' : undefined}
              tone="danger"
            />
          </StatLink>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Cobros y Carga" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href={unpaidHref}>
            <StatCard
              icon={CreditCard}
              label="Por Cobrar"
              value={fmtMoney(unpaidAmount)}
              hint={`${unpaidAgg._count._all} entregas sin pagar`}
              tone="warning"
            />
          </StatLink>
          <StatCard
            icon={Banknote}
            label="Cobrado del Mes"
            value={fmtMoney(collectedMonthAgg._sum.paymentAmount ?? 0)}
            tone="success"
          />
          <StatLink role={role} href="/delivery?status=Entregado">
            <StatCard
              icon={CheckCircle2}
              label="Entregadas del Mes"
              value={deliveredMonthAgg._count._all.toLocaleString()}
              hint={`${(deliveredMonthAgg._sum.weight ?? 0).toFixed(1)} lbs entregadas`}
              tone="success"
            />
          </StatLink>
          <StatCard
            icon={UserCheck}
            label="Comisiones del Mes"
            value={fmtMoney(profitMonthAgg._sum.managerProfit ?? 0)}
            hint="Generadas para agentes"
            tone="accent"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Paquetes y Mercancía" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href="/packages?status=Enviado">
            <StatCard
              icon={Truck}
              label="Paquetes en Camino"
              value={packagesInTransit.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/packages?status=Recibido">
            <StatCard
              icon={Package}
              label="Paquetes por Revisar"
              value={packagesToReview.toLocaleString()}
              hint="Marcar llegadas de productos"
              tone="warning"
            />
          </StatLink>
          <StatLink role={role} href="/delivery/prepare">
            <StatCard
              icon={PackageCheck}
              label="Mercancía Lista"
              value={`${totalReadyUnits.toLocaleString()} uds`}
              hint={`${readyClients.length} clientes esperan`}
              tone="success"
            />
          </StatLink>
          <StatLink role={role} href="/delivery/prepare">
            <StatCard
              icon={Users}
              label="Clientes por Avisar"
              value={readyClients.length.toLocaleString()}
              hint="Con mercancía por recoger"
              tone="accent"
            />
          </StatLink>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard
          icon={PackageCheck}
          title="Clientes con entregas por recoger"
          hint="Mercancía recibida sin entregar"
          viewAll={{ href: '/delivery/prepare', label: 'Preparar' }}
        >
          {readyClients.length === 0 ? (
            <ListEmpty
              icon={PackageCheck}
              message="No hay mercancía pendiente de entregar"
            />
          ) : (
            readyClients.slice(0, 8).map((c) => (
              <RowLink key={`${c.name}-${c.phone}`} href="/delivery/prepare">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{c.phone}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {c.readyUnits}{' '}
                    <span className="text-xs font-normal text-muted">
                      uds listas
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {c.productCount}{' '}
                    {c.productCount === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </RowLink>
            ))
          )}
        </ListCard>

        <ListCard
          icon={Truck}
          title="Últimas entregas"
          hint="Cobro y comisión de cada entrega"
          viewAll={{ href: '/delivery', label: 'Ver todas' }}
        >
          {recentDeliveries.length === 0 ? (
            <ListEmpty icon={Truck} message="Aún no hay entregas registradas" />
          ) : (
            recentDeliveries.map((d) => (
              <RowLink key={d.id.toString()} href={`/delivery/${d.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {`${d.client.name} ${d.client.lastName}`.trim()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(d.deliverDate)} · {d.weight.toFixed(1)} lbs
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
      </div>

      {failedCount === 0 && pendingCount === 0 && transitCount === 0 ? (
        <ListCard icon={CheckCircle2} title="Todo al día">
          <Row>
            <p className="text-sm text-muted">
              No tienes entregas activas ahora mismo. Revisa los paquetes por
              procesar o la mercancía lista para armar nuevas entregas.
            </p>
          </Row>
        </ListCard>
      ) : null}
    </section>
  );
}
