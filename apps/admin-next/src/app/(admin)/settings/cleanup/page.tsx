import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CleanupClient } from './cleanup-client';

export const dynamic = 'force-dynamic';

/** Configuración → Limpieza: eliminar o vaciar datos del sistema. */
export default async function CleanupPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  const [
    orders,
    products,
    purchases,
    purchaseRows,
    packages,
    packageRows,
    deliveries,
    deliveryRows,
    expenses,
    invoices,
    invoiceRows,
    balances,
    notifications,
    notificationsDone,
    shops,
    accounts,
    categories,
    clients,
  ] = await prisma.$transaction([
    prisma.order.count(),
    prisma.product.count(),
    prisma.shoppingReceip.count(),
    prisma.productBuyed.count(),
    prisma.package.count(),
    prisma.productReceived.count(),
    prisma.deliverReceip.count(),
    prisma.productDelivery.count(),
    prisma.expense.count(),
    prisma.invoice.count(),
    prisma.tag.count(),
    prisma.balance.count(),
    prisma.notification.count(),
    prisma.notification.count({
      where: {
        OR: [{ isRead: true }, { expiresAt: { lt: new Date() } }],
      },
    }),
    prisma.shop.count(),
    prisma.buyingAccounts.count(),
    prisma.category.count(),
    prisma.customUser.count({ where: { role: 'client' } }),
  ]);

  return (
    <CleanupClient
      counts={{
        orders,
        products,
        purchases,
        purchaseRows,
        packages,
        packageRows,
        deliveries,
        deliveryRows,
        expenses,
        invoices,
        invoiceRows,
        balances,
        notifications,
        notificationsDone,
        shops,
        accounts,
        categories,
        clients,
      }}
    />
  );
}
