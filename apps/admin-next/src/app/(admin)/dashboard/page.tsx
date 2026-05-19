import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';

export default async function DashboardPage() {
  const session = await auth();

  const [
    clientCount,
    orderCount,
    pendingPayOrders,
    deliveryCount,
    productCount,
    revenueAgg,
    costAgg,
    expenseAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.customUser.count({ where: { role: 'client' } }),
    prisma.order.count(),
    prisma.order.count({ where: { payStatus: { not: 'Pagado' } } }),
    prisma.deliverReceip.count(),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { receivedValueOfClient: true } }),
    prisma.order.aggregate({ _sum: { totalCosts: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.order.findMany({
      include: { client: { select: { name: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const revenue = revenueAgg._sum.receivedValueOfClient ?? 0;
  const cost = costAgg._sum.totalCosts ?? 0;
  const expenses = expenseAgg._sum.amount ?? 0;
  const grossProfit = revenue - cost - expenses;

  const stats = [
    { label: 'Clients', value: clientCount.toString(), href: '/users' },
    { label: 'Orders', value: orderCount.toString(), href: '/orders' },
    {
      label: 'Orders pending payment',
      value: pendingPayOrders.toString(),
      href: '/orders?pay=No%20pagado',
    },
    {
      label: 'Deliveries',
      value: deliveryCount.toString(),
      href: '/delivery',
    },
    { label: 'Products', value: productCount.toString(), href: '/orders' },
    {
      label: 'Revenue received',
      value: formatCurrency(revenue),
      href: '/orders',
    },
    {
      label: 'Order costs',
      value: formatCurrency(cost),
      href: '/orders',
    },
    {
      label: 'Expenses',
      value: formatCurrency(expenses),
      href: '/expenses',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Welcome, {session?.user.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Gross profit (revenue − order costs − expenses)
        </p>
        <p
          className={`mt-1 text-3xl font-semibold tabular-nums ${
            grossProfit >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(grossProfit)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Indicative only — based on stored order totals and recorded
          expenses.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800">
          Recent orders
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Pay</th>
              <th className="px-4 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {recentOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-zinc-500"
                >
                  No orders yet.
                </td>
              </tr>
            ) : (
              recentOrders.map((o) => (
                <tr key={o.id.toString()}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/orders/${o.id.toString()}`}
                      className="font-medium hover:underline"
                    >
                      {o.client.name} {o.client.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{o.status}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {o.payStatus === 'NoPagado' ? 'No pagado' : o.payStatus}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {formatCurrency(o.totalCosts)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
