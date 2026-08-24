import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { round2 } from '@/lib/order-cost';
import { DashboardGreeting } from './dashboard-greeting';
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
  type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface MetricCardData {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  borderColor: string;
  hoverColor: string;
}

interface MetricGroup {
  label: string;
  accent: string;
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
      accent: 'border-orange-400',
      cards: [
        {
          title: 'Total Usuarios',
          value: totalUsers.toLocaleString(),
          icon: Users,
          iconBg: 'bg-orange-500',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:border-orange-300 hover:shadow-orange-50',
        },
        {
          title: 'Total Productos',
          value: totalProducts.toLocaleString(),
          icon: Package,
          iconBg: 'bg-orange-500',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:border-orange-300 hover:shadow-orange-50',
        },
        {
          title: 'Órdenes del Mes',
          value: ordersMonth.toLocaleString(),
          icon: ShoppingCart,
          iconBg: 'bg-orange-500',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:border-orange-300 hover:shadow-orange-50',
        },
        {
          title: 'Ingresos del Mes',
          value: `$${(revenueMonthAgg._sum.receivedValueOfClient ?? 0).toLocaleString()}`,
          icon: DollarSign,
          iconBg: 'bg-orange-500',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:border-orange-300 hover:shadow-orange-50',
        },
      ],
    },
    {
      label: 'Finanzas',
      accent: 'border-emerald-400',
      cards: [
        {
          title: 'Ganancia Total',
          value: fmt(profit),
          icon: TrendingUp,
          iconBg: 'bg-emerald-500',
          borderColor: 'border-emerald-200',
          hoverColor: 'hover:border-emerald-400 hover:shadow-emerald-50',
        },
        {
          title: 'Margen de Ganancia',
          value: `${margin.toFixed(1)}%`,
          icon: TrendingUp,
          iconBg: 'bg-cyan-500',
          borderColor: 'border-cyan-200',
          hoverColor: 'hover:border-cyan-400 hover:shadow-cyan-50',
        },
        {
          title: 'Entregas Sin Pagar',
          value: fmt(Math.max(0, unpaidAmount)),
          subtitle: `${unpaidDeliveries._count._all} entregas`,
          icon: CreditCard,
          iconBg: 'bg-amber-500',
          borderColor: 'border-amber-200',
          hoverColor: 'hover:border-amber-400 hover:shadow-amber-50',
        },
        {
          title: 'Gastos del Mes',
          value: fmt(expensesMonthAgg._sum.amount ?? 0),
          icon: TrendingDown,
          iconBg: 'bg-slate-500',
          borderColor: 'border-slate-200',
          hoverColor: 'hover:border-slate-400 hover:shadow-slate-50',
        },
      ],
    },
    {
      label: 'Clientes & Operaciones',
      accent: 'border-blue-400',
      cards: [
        {
          title: 'Deudas Pendientes',
          value: fmt(Math.abs(debtClients._sum.balance ?? 0)),
          subtitle: `${debtClients._count._all} clientes`,
          icon: AlertCircle,
          iconBg: 'bg-rose-500',
          borderColor: 'border-rose-200',
          hoverColor: 'hover:border-rose-400 hover:shadow-rose-50',
        },
        {
          title: 'Saldos a Favor',
          value: fmt(surplusClients._sum.balance ?? 0),
          subtitle: `${surplusClients._count._all} clientes`,
          icon: Wallet,
          iconBg: 'bg-violet-500',
          borderColor: 'border-violet-200',
          hoverColor: 'hover:border-violet-400 hover:shadow-violet-50',
        },
        {
          title: 'Peso Total Entregado',
          value: `${(deliveredWeightAgg._sum.weight ?? 0).toFixed(1)} lbs`,
          icon: Truck,
          iconBg: 'bg-yellow-500',
          borderColor: 'border-yellow-200',
          hoverColor: 'hover:border-yellow-400 hover:shadow-yellow-50',
        },
        {
          title: 'Comisiones de Agentes',
          value: fmt(commissionsAgg._sum.managerProfit ?? 0),
          subtitle: `${agentCount} agentes`,
          icon: UserCheck,
          iconBg: 'bg-blue-500',
          borderColor: 'border-blue-200',
          hoverColor: 'hover:border-blue-400 hover:shadow-blue-50',
        },
        {
          title: 'Reembolsos Totales',
          value: fmt(refundsAgg._sum.refundAmount ?? 0),
          icon: Receipt,
          iconBg: 'bg-rose-500',
          borderColor: 'border-rose-200',
          hoverColor: 'hover:border-rose-400 hover:shadow-rose-50',
        },
      ],
    },
  ];

  return (
    <div className="animate-in space-y-8 pb-8 fade-in duration-500">
      <DashboardGreeting role={role} rate={common?.changeRate ?? 0} />

      <section className="animate-in space-y-4 duration-700 slide-in-from-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              {role === 'agent' ? 'Mi Panel' : 'Métricas'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Resumen de las métricas más importantes de tu negocio
            </p>
          </div>
        </div>
        <hr className="my-4 border-border" />

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div
                className={`flex items-center gap-2 border-l-4 pl-3 ${group.accent}`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {group.label}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 bg-white py-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${card.borderColor} ${card.hoverColor}`}
                    >
                      <div
                        className={`absolute right-0 top-0 h-20 w-20 -translate-y-5 translate-x-5 transform rounded-full opacity-[0.06] transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}
                      />
                      <div className="relative z-10 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              {card.title}
                            </p>
                            <p className="truncate text-2xl font-extrabold tracking-tight text-gray-900">
                              {card.value}
                            </p>
                            {card.subtitle ? (
                              <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                <span className="h-1 w-1 flex-shrink-0 rounded-full bg-gray-300" />
                                {card.subtitle}
                              </p>
                            ) : null}
                          </div>
                          <div
                            className={`flex-shrink-0 transform rounded-lg p-2 shadow-sm transition-all duration-300 group-hover:scale-105 ${card.iconBg}`}
                          >
                            <Icon className="h-5 w-5 text-white" aria-hidden />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
