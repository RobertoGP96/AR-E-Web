'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Package2,
  ShoppingCart,
  Settings,
  Store,
  ShoppingBag,
  Truck,
  Tag,
  ReceiptIcon,
  ChartColumn,
  ReceiptText,
  BaggageClaim,
  CoinsIcon,
  User,
  type LucideIcon,
} from 'lucide-react';
import { canAccessPath } from '@/lib/route-roles';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Same grouping and labels as the Vite admin's AsideNav. */
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Gestión',
    items: [
      { name: 'Usuarios', href: '/users', icon: Users },
      { name: 'Tiendas', href: '/shops', icon: Store },
      { name: 'Categorías', href: '/categories', icon: Tag },
    ],
  },
  {
    title: 'Órdenes y Productos',
    items: [
      { name: 'Órdenes', href: '/orders', icon: ShoppingCart },
      { name: 'Productos', href: '/products', icon: Package2 },
    ],
  },
  {
    title: 'Logística',
    items: [
      { name: 'Compras', href: '/purchases', icon: ShoppingBag },
      { name: 'Paquetes', href: '/packages', icon: Package },
      { name: 'Entrega', href: '/delivery', icon: Truck },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { name: 'Costos de Envío', href: '/invoices', icon: BaggageClaim },
      { name: 'Registro de Gastos', href: '/expenses', icon: ReceiptText },
      { name: 'Balance General', href: '/balance', icon: ReceiptIcon },
      { name: 'Balance de Clientes', href: '/client-balances', icon: CoinsIcon },
      { name: 'Análisis', href: '/analytics', icon: ChartColumn },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Perfil', href: '/profile', icon: User },
];

export function AdminNav({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessPath(role, item.href)),
  })).filter((group) => group.items.length > 0);

  const bottomItems = BOTTOM_ITEMS.filter((item) =>
    canAccessPath(role, item.href)
  );

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[15px] transition ${
            active
              ? 'bg-sidebar-accent font-medium text-white'
              : 'text-sidebar-foreground/90 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
          <span className="truncate">{item.name}</span>
        </Link>
      </li>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {groups.map((group) => (
        <div key={group.title} className="mb-2">
          <div className="px-3 pb-1.5 pt-2 text-[13px] font-semibold uppercase tracking-wide text-orange-400/85">
            {group.title}
          </div>
          <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
        </div>
      ))}
      <div className="mt-auto pt-2">
        <ul className="space-y-0.5">{bottomItems.map(renderItem)}</ul>
      </div>
    </nav>
  );
}
