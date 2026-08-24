'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Coins,
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
  '/profile': 'Mi Perfil',
  '/categories': 'Categorías',
  '/invoices': 'Costos de Envío',
  '/expenses': 'Gastos',
  '/analytics': 'Análisis',
  '/balance': 'Balance',
  '/client-balances': 'Balance de Clientes',
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
  '/profile': UserCircle,
  '/categories': Tags,
  '/invoices': BaggageClaim,
  '/expenses': FileText,
  '/analytics': ChartColumn,
  '/balance': Receipt,
  '/client-balances': Coins,
};

const DETAIL_NAMES: Record<string, string> = {
  '/products': 'Detalles del Producto',
  '/purchases': 'Detalles de Compra',
  '/orders': 'Detalles de Orden',
  '/packages': 'Detalles del Paquete',
  '/delivery': 'Detalles de Entrega',
};

function Chevron() {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="size-5 shrink-0 text-orange-400"
    >
      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
    </svg>
  );
}

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
    <nav aria-label="Breadcrumb" className="ml-2 flex">
      <ol role="list" className="flex flex-row items-center space-x-4">
        <li>
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-500"
            >
              <Home
                aria-hidden="true"
                className="size-5 shrink-0 text-orange-400"
              />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="hidden sm:block">
            <div className="flex items-center">
              <Chevron />
              <Link
                href={crumb.href}
                aria-current={crumb.current ? 'page' : undefined}
                className="ml-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {crumb.Icon ? (
                  <crumb.Icon className="size-4 shrink-0 text-orange-400" />
                ) : null}
                {crumb.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
