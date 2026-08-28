import Link from 'next/link';
import {
  ArrowUpRight,
  Store,
  Tag,
  UserCog,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessPath } from '@/lib/route-roles';
import { SettingsForm } from './settings-form';

interface ConfigLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Parámetros que se configuran en su propia sección del panel. */
const CONFIG_LINKS: ConfigLink[] = [
  {
    href: '/categories',
    title: 'Cobro de envío por categoría',
    description:
      'Costo y cobro por libra de cada categoría de producto (el sistema cobra el envío por categoría).',
    icon: Tag,
  },
  {
    href: '/shops',
    title: 'Impuestos por tienda',
    description:
      'Porcentaje de impuesto que aplica cada tienda (Shein, Amazon, Temu…) sobre el valor de compra.',
    icon: Store,
  },
  {
    href: '/users',
    title: 'Ganancia por agente',
    description:
      'Porcentaje de ganancia y clientes asignados de cada agente, en la gestión de usuarios.',
    icon: UserCog,
  },
];

export default async function SettingsPage() {
  const session = await auth();
  const role = session?.user.role ?? '';
  const canEdit = role === 'admin' || role === 'accountant';

  const info = await prisma.commonInformation.findFirst({
    orderBy: { id: 'asc' },
    select: { changeRate: true, costPerPound: true },
  });

  const links = CONFIG_LINKS.filter((l) => canAccessPath(role, l.href));

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <SettingsForm
        canEdit={canEdit}
        defaults={{
          changeRate: info?.changeRate ?? 0,
          costPerPound: info?.costPerPound ?? 0,
        }}
      />
      {links.length > 0 ? (
        <section className="surface-card p-5">
          <div className="flex items-center gap-2.5 border-b border-separator pb-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Otros elementos configurables
            </h2>
          </div>
          <ul className="mt-4 space-y-2">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-start gap-3 rounded-xl border border-separator px-3.5 py-3 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-default text-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                        {l.title}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                          aria-hidden
                        />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {l.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
