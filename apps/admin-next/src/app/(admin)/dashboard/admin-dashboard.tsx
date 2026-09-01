import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { StatCard } from '@/components/ui';
import {
  AlertCircle,
  ChartColumn,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  PackageCheck,
  Percent,
  Receipt,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DashboardHeading,
  QuickActions,
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
    description: 'Crear y gestionar pedidos de clientes',
  },
  {
    href: '/delivery/prepare',
    icon: ClipboardList,
    title: 'Preparar entregas',
    description: 'Revisar paquetes y armar entregas',
  },
  {
    href: '/purchases',
    icon: ShoppingBag,
    title: 'Compras',
    description: 'Registrar compras en tiendas',
  },
  {
    href: '/users',
    icon: Users,
    title: 'Usuarios',
    description: 'Clientes, agentes y personal',
  },
  {
    href: '/packages',
    icon: Package,
    title: 'Paquetes',
    description: 'Trackings y llegadas de mercancía',
  },
  {
    href: '/expenses',
    icon: ReceiptText,
    title: 'Gastos',
    description: 'Registrar gastos del negocio',
  },
  {
    href: '/analytics',
    icon: ChartColumn,
    title: 'Análisis',
    description: 'Tendencias de 12 meses',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Configuración',
    description: 'Tasa de cambio y costo por libra',
  },
];

/**
 * Dashboard del rol admin: visión completa del negocio — atajos a
 * todas las áreas, pulso operativo del día y las métricas globales.
 */
export async function AdminDashboard({ role }: { role: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalProducts,
    ordersMonth,
    revenueMonthAgg,
    revenueOrdersAgg,
    revenueDeliveriesAgg,
    purchaseCostAgg,
    expensesAllAgg,
    expensesMonthAgg,
    unpaidDeliveries,
    debtClients,
    surplusClients,
    deliveredWeightAgg,
    agentCount,
    commissionsAgg,
    refundsAgg,
    pendingDeliveriesCount,
    transitDeliveriesCount,
    packagesToProcess,
    readyAgg,
    activeOrdersCount,
  ] = await Promise.all([
    prisma.customUser.count(),
    prisma.product.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { receivedValueOfClient: true },
    }),
    prisma.order.aggregate({ _sum: { receivedValueOfClient: true } }),
    prisma.deliverReceip.aggregate({ _sum: { paymentAmount: true } }),
    prisma.shoppingReceip.aggregate({ _sum: { totalCostOfPurchase: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { paymentStatus: { not: 'Pagado' } },
      _sum: { weightCost: true, paymentAmount: true },
      _count: { _all: true },
    }),
    prisma.customUser.aggregate({
      where: { role: 'client', balance: { lt: 0 } },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    prisma.customUser.aggregate({
      where: { role: 'client', balance: { gt: 0 } },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { status: 'Entregado' },
      _sum: { weight: true },
    }),
    prisma.customUser.count({ where: { role: 'agent', isActive: true } }),
    prisma.deliverReceip.aggregate({ _sum: { managerProfit: true } }),
    prisma.productBuyed.aggregate({ _sum: { refundAmount: true } }),
    prisma.deliverReceip.count({ where: { status: 'Pendiente' } }),
    prisma.deliverReceip.count({ where: { status: 'En transito' } }),
    prisma.package.count({
      where: { statusOfProcessing: { in: ['Enviado', 'Recibido'] } },
    }),
    prisma.product.aggregate({
      where: { amountReceived: { gt: 0 } },
      _sum: { amountReceived: true, amountDelivered: true },
    }),
    prisma.order.count({
      where: { status: { in: ['Encargado', 'Procesando'] } },
    }),
  ]);

  const revenue =
    (revenueOrdersAgg._sum.receivedValueOfClient ?? 0) +
    (revenueDeliveriesAgg._sum.paymentAmount ?? 0);
  const buys = purchaseCostAgg._sum.totalCostOfPurchase ?? 0;
  const expensesAll = expensesAllAgg._sum.amount ?? 0;
  const profit = round2(revenue - buys - expensesAll);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const unpaidAmount = round2(
    (unpaidDeliveries._sum.weightCost ?? 0) -
      (unpaidDeliveries._sum.paymentAmount ?? 0)
  );
  const readyUnits = Math.max(
    0,
    (readyAgg._sum.amountReceived ?? 0) - (readyAgg._sum.amountDelivered ?? 0)
  );

  return (
    <section className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-700">
      <DashboardHeading
        title="Métricas"
        subtitle="Resumen de las métricas más importantes de tu negocio"
      />
      <hr className="my-4 border-separator" />

      <div className="space-y-3">
        <SectionTitle label="Atajos" />
        <QuickActions role={role} actions={ACTIONS} />
      </div>

      <div className="space-y-3">
        <SectionTitle label="Pulso Operativo" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href="/delivery?status=Pendiente">
            <StatCard
              icon={Clock}
              label="Entregas Pendientes"
              value={pendingDeliveriesCount.toLocaleString()}
              hint={`${transitDeliveriesCount} en tránsito`}
              tone="warning"
            />
          </StatLink>
          <StatLink role={role} href="/packages">
            <StatCard
              icon={Package}
              label="Paquetes por Procesar"
              value={packagesToProcess.toLocaleString()}
              hint="Enviados o por revisar"
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/delivery/prepare">
            <StatCard
              icon={PackageCheck}
              label="Mercancía Lista"
              value={`${readyUnits.toLocaleString()} uds`}
              hint="Recibida sin entregar"
              tone="success"
            />
          </StatLink>
          <StatLink role={role} href="/orders">
            <StatCard
              icon={ShoppingCart}
              label="Órdenes Activas"
              value={activeOrdersCount.toLocaleString()}
              hint="Encargadas o procesando"
              tone="accent"
            />
          </StatLink>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Resumen General" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href="/users">
            <StatCard
              icon={Users}
              label="Total Usuarios"
              value={totalUsers.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/products">
            <StatCard
              icon={Package}
              label="Total Productos"
              value={totalProducts.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatLink role={role} href="/orders">
            <StatCard
              icon={ShoppingCart}
              label="Órdenes del Mes"
              value={ordersMonth.toLocaleString()}
              tone="accent"
            />
          </StatLink>
          <StatCard
            icon={DollarSign}
            label="Ingresos del Mes"
            value={`$${(revenueMonthAgg._sum.receivedValueOfClient ?? 0).toLocaleString()}`}
            tone="success"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Finanzas" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Ganancia Total"
            value={fmtMoney(profit)}
            tone="success"
          />
          <StatCard
            icon={Percent}
            label="Margen de Ganancia"
            value={`${margin.toFixed(1)}%`}
            tone="success"
          />
          <StatLink
            role={role}
            href={`/delivery?pay=${encodeURIComponent('No pagado')}`}
          >
            <StatCard
              icon={CreditCard}
              label="Entregas Sin Pagar"
              value={fmtMoney(Math.max(0, unpaidAmount))}
              hint={`${unpaidDeliveries._count._all} entregas`}
              tone="warning"
            />
          </StatLink>
          <StatLink role={role} href="/expenses">
            <StatCard
              icon={TrendingDown}
              label="Gastos del Mes"
              value={fmtMoney(expensesMonthAgg._sum.amount ?? 0)}
              tone="default"
            />
          </StatLink>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Clientes & Operaciones" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatLink role={role} href="/users?tab=balances">
            <StatCard
              icon={AlertCircle}
              label="Deudas Pendientes"
              value={fmtMoney(Math.abs(debtClients._sum.balance ?? 0))}
              hint={`${debtClients._count._all} clientes`}
              tone="danger"
            />
          </StatLink>
          <StatLink role={role} href="/users?tab=balances">
            <StatCard
              icon={Wallet}
              label="Saldos a Favor"
              value={fmtMoney(surplusClients._sum.balance ?? 0)}
              hint={`${surplusClients._count._all} clientes`}
              tone="success"
            />
          </StatLink>
          <StatCard
            icon={Truck}
            label="Peso Total Entregado"
            value={`${(deliveredWeightAgg._sum.weight ?? 0).toFixed(1)} lbs`}
            tone="accent"
          />
          <StatCard
            icon={UserCheck}
            label="Comisiones de Agentes"
            value={fmtMoney(commissionsAgg._sum.managerProfit ?? 0)}
            hint={`${agentCount} agentes`}
            tone="accent"
          />
          <StatCard
            icon={Receipt}
            label="Reembolsos Totales"
            value={fmtMoney(refundsAgg._sum.refundAmount ?? 0)}
            tone="warning"
          />
        </div>
      </div>
    </section>
  );
}
