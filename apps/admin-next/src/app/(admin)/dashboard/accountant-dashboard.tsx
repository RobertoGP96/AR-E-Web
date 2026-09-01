import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { StatCard } from '@/components/ui';
import { formatDate } from '@/lib/format';
import {
  AlertCircle,
  BaggageClaim,
  ChartColumn,
  CreditCard,
  DollarSign,
  Percent,
  Receipt,
  ReceiptIcon,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  DashboardHeading,
  ListCard,
  ListEmpty,
  QuickActions,
  Row,
  SectionTitle,
  StatLink,
  fmtMoney,
  type QuickAction,
} from './components';

const ACTIONS: readonly QuickAction[] = [
  {
    href: '/balance',
    icon: ReceiptIcon,
    title: 'Balance General',
    description: 'Cierres por período con generador de datos',
  },
  {
    href: '/expenses',
    icon: ReceiptText,
    title: 'Registro de Gastos',
    description: 'Anotar y clasificar los gastos del negocio',
  },
  {
    href: '/invoices',
    icon: BaggageClaim,
    title: 'Costos de Envío',
    description: 'Facturas de peso y costos fijos',
  },
  {
    href: '/analytics',
    icon: ChartColumn,
    title: 'Análisis',
    description: 'Tendencias de ingresos y gastos a 12 meses',
  },
];

/**
 * Dashboard del rol contador: resultados globales, cuentas por
 * cobrar, actividad financiera del mes y últimos gastos.
 */
export async function AccountantDashboard({ role }: { role: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    revenueOrdersAgg,
    revenueDeliveriesAgg,
    purchaseCostAgg,
    expensesAllAgg,
    expensesMonthAgg,
    revenueMonthOrdersAgg,
    collectedDeliveriesMonthAgg,
    unpaidOrdersAgg,
    unpaidDeliveriesAgg,
    debtClients,
    surplusClients,
    purchasesMonthAgg,
    invoicesMonthAgg,
    refundsAgg,
    recentExpenses,
    expensesByCategory,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { receivedValueOfClient: true } }),
    prisma.deliverReceip.aggregate({ _sum: { paymentAmount: true } }),
    prisma.shoppingReceip.aggregate({ _sum: { totalCostOfPurchase: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { receivedValueOfClient: true },
    }),
    prisma.deliverReceip.aggregate({
      where: { paymentDate: { gte: monthStart } },
      _sum: { paymentAmount: true },
    }),
    prisma.order.aggregate({
      where: { payStatus: { not: 'Pagado' } },
      _count: { _all: true },
      _sum: {
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
      },
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
    prisma.shoppingReceip.aggregate({
      where: { buyDate: { gte: monthStart } },
      _count: { _all: true },
      _sum: { totalCostOfPurchase: true },
    }),
    prisma.invoice.aggregate({
      where: { date: { gte: monthStart } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.productBuyed.aggregate({ _sum: { refundAmount: true } }),
    prisma.expense.findMany({
      select: {
        id: true,
        date: true,
        amount: true,
        category: true,
        description: true,
      },
      orderBy: { date: 'desc' },
      take: 6,
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  const revenue =
    (revenueOrdersAgg._sum.receivedValueOfClient ?? 0) +
    (revenueDeliveriesAgg._sum.paymentAmount ?? 0);
  const buys = purchaseCostAgg._sum.totalCostOfPurchase ?? 0;
  const expensesAll = expensesAllAgg._sum.amount ?? 0;
  const profit = round2(revenue - buys - expensesAll);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const revenueMonth = round2(
    (revenueMonthOrdersAgg._sum.receivedValueOfClient ?? 0) +
      (collectedDeliveriesMonthAgg._sum.paymentAmount ?? 0)
  );
  const outstandingOrders = Math.max(
    0,
    round2(
      (unpaidOrdersAgg._sum.totalCosts ?? 0) -
        (unpaidOrdersAgg._sum.receivedValueOfClient ?? 0) -
        (unpaidOrdersAgg._sum.balanceApplied ?? 0)
    )
  );
  const unpaidDeliveries = Math.max(
    0,
    round2(
      (unpaidDeliveriesAgg._sum.weightCost ?? 0) -
        (unpaidDeliveriesAgg._sum.paymentAmount ?? 0)
    )
  );

  const monthExpenses = expensesByCategory
    .map((e) => ({ category: e.category, amount: e._sum.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
  const monthExpensesTotal = monthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  return (
    <section className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-700">
      <DashboardHeading
        title="Mi Panel de Contabilidad"
        subtitle="Resultados del negocio, cuentas por cobrar y actividad del mes"
      />
      <hr className="my-4 border-separator" />

      <div className="space-y-3">
        <SectionTitle label="Atajos" />
        <QuickActions role={role} actions={ACTIONS} />
      </div>

      <div className="space-y-3">
        <SectionTitle label="Resultados" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Ingresos Totales"
            value={fmtMoney(revenue)}
            hint="Órdenes + entregas"
            tone="accent"
          />
          <StatCard
            icon={TrendingUp}
            label="Ganancia Total"
            value={fmtMoney(profit)}
            hint="Ingresos − compras − gastos"
            tone="success"
          />
          <StatCard
            icon={Percent}
            label="Margen de Ganancia"
            value={`${margin.toFixed(1)}%`}
            tone="success"
          />
          <StatCard
            icon={Receipt}
            label="Reembolsos Totales"
            value={fmtMoney(refundsAgg._sum.refundAmount ?? 0)}
            tone="warning"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Cuentas por Cobrar" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={CreditCard}
            label="Órdenes sin Cobrar"
            value={fmtMoney(outstandingOrders)}
            hint={`${unpaidOrdersAgg._count._all} órdenes`}
            tone="warning"
          />
          <StatCard
            icon={Truck}
            label="Entregas sin Pagar"
            value={fmtMoney(unpaidDeliveries)}
            hint={`${unpaidDeliveriesAgg._count._all} entregas`}
            tone="warning"
          />
          <StatLink role={role} href="/users?tab=balances">
            <StatCard
              icon={AlertCircle}
              label="Deudas de Clientes"
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
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle label="Mes en Curso" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Ingresos del Mes"
            value={fmtMoney(revenueMonth)}
            hint="Órdenes del mes + pagos de entregas"
            tone="success"
          />
          <StatCard
            icon={ShoppingBag}
            label="Compras del Mes"
            value={fmtMoney(purchasesMonthAgg._sum.totalCostOfPurchase ?? 0)}
            hint={`${purchasesMonthAgg._count._all} compras`}
            tone="accent"
          />
          <StatLink role={role} href="/expenses">
            <StatCard
              icon={TrendingDown}
              label="Gastos del Mes"
              value={fmtMoney(expensesMonthAgg._sum.amount ?? 0)}
              tone="default"
            />
          </StatLink>
          <StatLink role={role} href="/invoices">
            <StatCard
              icon={BaggageClaim}
              label="Costos de Envío del Mes"
              value={fmtMoney(Number(invoicesMonthAgg._sum.total ?? 0))}
              hint={`${invoicesMonthAgg._count._all} facturas`}
              tone="accent"
            />
          </StatLink>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard
          icon={ReceiptText}
          title="Últimos gastos"
          hint="Los 6 más recientes"
          viewAll={{ href: '/expenses', label: 'Ver todos' }}
        >
          {recentExpenses.length === 0 ? (
            <ListEmpty
              icon={ReceiptText}
              message="Aún no hay gastos registrados"
            />
          ) : (
            recentExpenses.map((e) => (
              <Row key={e.id.toString()}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.description?.trim() || e.category}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(e.date)} ·{' '}
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      {e.category}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-danger">
                  −{fmtMoney(e.amount)}
                </p>
              </Row>
            ))
          )}
        </ListCard>

        <ListCard
          icon={ChartColumn}
          title="Gastos del mes por categoría"
          hint={`Total: ${fmtMoney(monthExpensesTotal)}`}
          viewAll={{ href: '/analytics', label: 'Análisis' }}
        >
          {monthExpenses.length === 0 ? (
            <ListEmpty
              icon={ChartColumn}
              message="Sin gastos registrados este mes"
            />
          ) : (
            monthExpenses.map((e) => {
              const share =
                monthExpensesTotal > 0
                  ? (e.amount / monthExpensesTotal) * 100
                  : 0;
              return (
                <Row key={e.category}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {e.category}
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {fmtMoney(e.amount)}
                        <span className="ml-1.5 text-xs font-normal text-muted">
                          {share.toFixed(0)}%
                        </span>
                      </p>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent-soft"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(2, share)}%` }}
                      />
                    </div>
                  </div>
                </Row>
              );
            })
          )}
        </ListCard>
      </div>
    </section>
  );
}
