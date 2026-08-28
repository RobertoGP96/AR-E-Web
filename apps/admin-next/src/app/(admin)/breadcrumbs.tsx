'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Database,
  Home,
  Users,
  Store,
  Package,
  ShoppingBag,
  PackageCheck,
  Truck,
  ShoppingCart,
  Settings,
  UserCircle,
  Tags,
  BaggageClaim,
  FileText,
  ChartColumn,
  Receipt,
  ChevronRight,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';

// Route → label map, ported from the Vite admin's BreadcrumbNavigation.
const ROUTE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Usuarios',
  '/shops': 'Tiendas',
  '/products': 'Productos',
  '/purchases': 'Compras',
  '/packages': 'Paquetes',
  '/delivery': 'Entrega',
  '/orders': 'Órdenes',
  '/settings': 'Configuración',
  '/settings/data': 'Gestión de Datos',
  '/settings/import': 'Importar Excel',
  '/settings/system': 'Sistema',
  '/profile': 'Mi Perfil',
  '/categories': 'Categorías',
  '/invoices': 'Costos de Envío',
  '/expenses': 'Gastos',
  '/analytics': 'Análisis',
  '/balance': 'Balance',
};

const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/users': Users,
  '/shops': Store,
  '/products': Package,
  '/purchases': ShoppingBag,
  '/packages': PackageCheck,
  '/delivery': Truck,
  '/orders': ShoppingCart,
  '/settings': Settings,
  '/settings/data': Database,
  '/settings/import': FileSpreadsheet,
  '/settings/system': Activity,
  '/profile': UserCircle,
  '/categories': Tags,
  '/invoices': BaggageClaim,
  '/expenses': FileText,
  '/analytics': ChartColumn,
  '/balance': Receipt,
};

const DETAIL_NAMES: Record<string, string> = {
  '/products': 'Detalles del Producto',
  '/purchases': 'Detalles de Compra',
  '/orders': 'Detalles de Orden',
  '/packages': 'Detalles del Paquete',
  '/delivery': 'Detalles de Entrega',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    const parent = `/${segments.slice(0, i).join('/')}`;
    const isId = /^\d+$/.test(segment) || /^[0-9a-f-]{36}$/.test(segment);
    const name = isId
      ? (DETAIL_NAMES[parent] ?? 'Detalles')
      : (ROUTE_NAMES[href] ??
        segment.charAt(0).toUpperCase() + segment.slice(1));
    const Icon = isId ? undefined : ROUTE_ICONS[href];
    return { href, name, Icon, current: i === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="ml-1 flex min-w-0">
      <ol role="list" className="flex min-w-0 flex-row items-center gap-1.5">
        <li className="shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center rounded-md p-1.5 text-accent transition-colors hover:bg-accent-soft"
          >
            <Home aria-hidden="true" className="size-4.5 shrink-0" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="hidden min-w-0 sm:block">
            <div className="flex min-w-0 items-center gap-1.5">
              <ChevronRight
                className="size-4 shrink-0 text-muted/60"
                aria-hidden
              />
              <Link
                href={crumb.href}
                aria-current={crumb.current ? 'page' : undefined}
                className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors ${
                  crumb.current
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted hover:bg-default hover:text-foreground'
                }`}
              >
                {crumb.Icon ? (
                  <crumb.Icon className="size-4 shrink-0 text-accent" />
                ) : null}
                <span className="truncate">{crumb.name}</span>
              </Link>
            </div>
          </li>
        ))}
        {/* On phones show only the current page name */}
        <li className="min-w-0 sm:hidden">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden />
            <span className="truncate">{crumbs[crumbs.length - 1]?.name}</span>
          </span>
        </li>
      </ol>
    </nav>
  );
}
