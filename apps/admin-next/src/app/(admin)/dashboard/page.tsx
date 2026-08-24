import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { round2 } from '@/lib/order-cost';
import { DashboardGreeting } from './dashboard-greeting';
import { StatCard, type StatTone } from '@/components/ui';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  Wallet,
  Truck,
  UserCheck,
  Receipt,
  Percent,
  type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface MetricCardData {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone: StatTone;
}

interface MetricGroup {
  label: string;
  cards: MetricCardData[];
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role ?? 'admin';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    common,
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
  ] = await Promise.all([
    prisma.commonInformation.findFirst({ orderBy: { id: 'asc' } }),
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

  const groups: MetricGroup[] = [
    {
      label: 'Resumen General',
      cards: [
        {
          title: 'Total Usuarios',
          value: totalUsers.toLocaleString(),
          icon: Users,
          tone: 'accent',
        },
        {
          title: 'Total Productos',
          value: totalProducts.toLocaleString(),
          icon: Package,
          tone: 'accent',
        },
        {
          title: 'Órdenes del Mes',
          value: ordersMonth.toLocaleString(),
          icon: ShoppingCart,
          tone: 'accent',
        },
        {
          title: 'Ingresos del Mes',
          value: `$${(revenueMonthAgg._sum.receivedValueOfClient ?? 0).toLocaleString()}`,
          icon: DollarSign,
          tone: 'success',
        },
      ],
    },
    {
      label: 'Finanzas',
      cards: [
        {
          title: 'Ganancia Total',
          value: fmt(profit),
          icon: TrendingUp,
          tone: 'success',
        },
        {
          title: 'Margen de Ganancia',
          value: `${margin.toFixed(1)}%`,
          icon: Percent,
          tone: 'success',
        },
        {
          title: 'Entregas Sin Pagar',
          value: fmt(Math.max(0, unpaidAmount)),
          subtitle: `${unpaidDeliveries._count._all} entregas`,
          icon: CreditCard,
          tone: 'warning',
        },
        {
          title: 'Gastos del Mes',
          value: fmt(expensesMonthAgg._sum.amount ?? 0),
          icon: TrendingDown,
          tone: 'default',
        },
      ],
    },
    {
      label: 'Clientes & Operaciones',
      cards: [
        {
          title: 'Deudas Pendientes',
          value: fmt(Math.abs(debtClients._sum.balance ?? 0)),
          subtitle: `${debtClients._count._all} clientes`,
          icon: AlertCircle,
          tone: 'danger',
        },
        {
          title: 'Saldos a Favor',
          value: fmt(surplusClients._sum.balance ?? 0),
          subtitle: `${surplusClients._count._all} clientes`,
          icon: Wallet,
          tone: 'success',
        },
        {
          title: 'Peso Total Entregado',
          value: `${(deliveredWeightAgg._sum.weight ?? 0).toFixed(1)} lbs`,
          icon: Truck,
          tone: 'accent',
        },
        {
          title: 'Comisiones de Agentes',
          value: fmt(commissionsAgg._sum.managerProfit ?? 0),
          subtitle: `${agentCount} agentes`,
          icon: UserCheck,
          tone: 'accent',
        },
        {
          title: 'Reembolsos Totales',
          value: fmt(refundsAgg._sum.refundAmount ?? 0),
          icon: Receipt,
          tone: 'warning',
        },
      ],
    },
  ];

  return (
    <div className="animate-in space-y-8 pb-8 fade-in duration-500">
      <DashboardGreeting role={role} rate={common?.changeRate ?? 0} />

      <section className="animate-in space-y-4 fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {role === 'agent' ? 'Mi Panel' : 'Métricas'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Resumen de las métricas más importantes de tu negocio
          </p>
        </div>
        <hr className="my-4 border-separator" />

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 border-l-4 border-accent pl-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                  {group.label}
                </h3>
              </div>
              <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {group.cards.map((card) => (
                  <StatCard
                    key={card.title}
                    icon={card.icon}
                    label={card.title}
                    value={card.value}
                    hint={card.subtitle}
                    tone={card.tone}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
