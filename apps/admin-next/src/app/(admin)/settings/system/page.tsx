import { redirect } from 'next/navigation';
import {
  AppWindow,
  Bell,
  Database,
  Layers,
  Users,
  Zap,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/ui';
import { formatDate } from '@/lib/format';
import pkg from '../../../../../package.json';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administradores',
  agent: 'Agentes',
  accountant: 'Contadores',
  logistical: 'Logística',
  client: 'Clientes',
};

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5">
      <h2 className="border-b border-separator pb-3 text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/** Latencia de la BD medida con la consulta más barata posible. */
async function pingDatabase(): Promise<{ ok: boolean; ms: number }> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: 0 };
  }
}

/** Configuración → Sistema: estado de la app y la base de datos. */
export default async function SystemPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  const { ok: dbOk, ms: dbMs } = await pingDatabase();

  const empty = {
    usersByRole: [] as { role: string; _count: number }[],
    counts: [] as number[],
    info: null as { changeRate: number; costPerPound: number; updatedAt: Date } | null,
    unread: 0,
  };
  const data = dbOk
    ? await (async () => {
        const [usersByRole, info, unread, ...counts] = await Promise.all([
          prisma.customUser.groupBy({ by: ['role'], _count: true }),
          prisma.commonInformation.findFirst({
            orderBy: { id: 'asc' },
            select: { changeRate: true, costPerPound: true, updatedAt: true },
          }),
          prisma.notification.count({ where: { isRead: false } }),
          prisma.order.count(),
          prisma.product.count(),
          prisma.shoppingReceip.count(),
          prisma.package.count(),
          prisma.deliverReceip.count(),
          prisma.expense.count(),
          prisma.invoice.count(),
          prisma.balance.count(),
          prisma.notification.count(),
        ]);
        return { usersByRole, info, unread, counts };
      })()
    : empty;

  const [
    orders = 0,
    products = 0,
    purchases = 0,
    packages = 0,
    deliveries = 0,
    expenses = 0,
    invoices = 0,
    balances = 0,
    notifications = 0,
  ] = data.counts;

  const totalUsers = data.usersByRole.reduce((acc, r) => acc + r._count, 0);
  const totalRecords =
    totalUsers +
    orders +
    products +
    purchases +
    packages +
    deliveries +
    expenses +
    invoices +
    balances;

  const entityCounts: { label: string; value: number }[] = [
    { label: 'Órdenes', value: orders },
    { label: 'Productos', value: products },
    { label: 'Compras', value: purchases },
    { label: 'Paquetes', value: packages },
    { label: 'Entregas', value: deliveries },
    { label: 'Gastos', value: expenses },
    { label: 'Costos de envío', value: invoices },
    { label: 'Balances', value: balances },
  ];

  const nf = new Intl.NumberFormat('es');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Base de datos"
          value={dbOk ? 'En línea' : 'Sin conexión'}
          hint={dbOk ? `Respuesta en ${dbMs} ms` : 'Revisa la conexión'}
          tone={dbOk ? 'success' : 'danger'}
        />
        <StatCard
          icon={Layers}
          label="Registros"
          value={nf.format(totalRecords)}
          hint="Total en las entidades principales"
        />
        <StatCard
          icon={Users}
          label="Usuarios"
          value={nf.format(totalUsers)}
          hint={`${nf.format(
            data.usersByRole.find((r) => r.role === 'client')?._count ?? 0
          )} clientes`}
        />
        <StatCard
          icon={Bell}
          label="Notificaciones"
          value={nf.format(notifications)}
          hint={`${nf.format(data.unread)} sin leer`}
          tone={data.unread > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <InfoCard title="Registros por entidad">
          <dl className="space-y-2.5">
            {entityCounts.map((e) => (
              <InfoRow
                key={e.label}
                label={e.label}
                value={nf.format(e.value)}
              />
            ))}
          </dl>
        </InfoCard>

        <InfoCard title="Usuarios por rol">
          <dl className="space-y-2.5">
            {data.usersByRole
              .slice()
              .sort((a, b) => b._count - a._count)
              .map((r) => (
                <InfoRow
                  key={r.role}
                  label={ROLE_LABELS[r.role] ?? r.role}
                  value={nf.format(r._count)}
                />
              ))}
          </dl>
        </InfoCard>

        <InfoCard title="Aplicación">
          <dl className="space-y-2.5">
            <InfoRow
              label="Versión del panel"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  <AppWindow className="h-3.5 w-3.5 text-accent" aria-hidden />
                  v{pkg.version}
                </span>
              }
            />
            <InfoRow
              label="Entorno"
              value={
                process.env.NODE_ENV === 'production'
                  ? 'Producción'
                  : 'Desarrollo'
              }
            />
            <InfoRow
              label="Base de datos"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  <Database className="h-3.5 w-3.5 text-accent" aria-hidden />
                  PostgreSQL (Neon)
                </span>
              }
            />
            <InfoRow
              label="Tasa de cambio"
              value={data.info ? data.info.changeRate.toFixed(2) : '—'}
            />
            <InfoRow
              label="Costo por libra"
              value={data.info ? `$${data.info.costPerPound.toFixed(2)}` : '—'}
            />
            <InfoRow
              label="Parámetros actualizados"
              value={data.info ? formatDate(data.info.updatedAt) : '—'}
            />
          </dl>
        </InfoCard>
      </div>
    </div>
  );
}
