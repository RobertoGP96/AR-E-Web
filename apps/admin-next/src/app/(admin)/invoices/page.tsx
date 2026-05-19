import { prisma } from '@/lib/prisma';
import { InvoicesClient } from './invoices-client';
import type { InvoiceRow, TagType } from './schema';

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { tags: { orderBy: { id: 'asc' } } },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const rows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id.toString(),
    date: inv.date.toISOString(),
    total: Number(inv.total),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    tags: inv.tags.map((t) => ({
      id: t.id.toString(),
      type: t.type as TagType,
      weight: Number(t.weight),
      costPerLb: Number(t.costPerLb),
      fixedCost: Number(t.fixedCost),
      subtotal: Number(t.subtotal),
    })),
  }));

  return <InvoicesClient initialRows={rows} />;
}
