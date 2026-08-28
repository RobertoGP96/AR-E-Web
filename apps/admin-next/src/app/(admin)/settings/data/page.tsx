import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/action-helpers';
import { EXPORT_ENTITIES } from '@/lib/data-export';
import { DataClient } from './data-client';

/** Configuración → Datos: salvas, exportación e importación. */
export default async function DataManagementPage() {
  const session = await auth();
  const role = session?.user.role ?? '';
  if (!(ROLES.finance as readonly string[]).includes(role)) {
    redirect('/unauthorized');
  }

  // Un count por entidad exportable, en el mismo orden del registro.
  const counts = await prisma.$transaction([
    prisma.customUser.count(),
    prisma.shop.count(),
    prisma.category.count(),
    prisma.buyingAccounts.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.shoppingReceip.count(),
    prisma.package.count(),
    prisma.deliverReceip.count(),
    prisma.expense.count(),
    prisma.invoice.count(),
    prisma.balance.count(),
  ]);

  const entities = EXPORT_ENTITIES.map((e, i) => ({
    key: e.key,
    label: e.label,
    description: e.description,
    count: counts[i] ?? 0,
  }));

  return <DataClient entities={entities} canImport={role === 'admin'} />;
}
