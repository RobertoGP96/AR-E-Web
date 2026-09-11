import {
  BaggageClaim,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Package,
  Package2,
  ReceiptIcon,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { canAccessPath } from '@/lib/route-roles';

/**
 * Catálogo único de secciones del panel. Lo consumen el sidebar
 * (admin-nav.tsx), el drawer móvil y la barra inferior (bottom-nav.tsx),
 * de modo que etiquetas, iconos y detección de sección activa no se
 * dupliquen. Módulo sin dependencias de Node (seguro para el cliente).
 */
export interface NavSection {
  href: string;
  /** Etiqueta completa (sidebar / drawer). */
  label: string;
  /** Etiqueta corta para la barra inferior móvil (≤ 10 caracteres). */
  short: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavSection[];
}

/** Mismos grupos y etiquetas que el AsideNav del admin Vite. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { href: '/dashboard', label: 'Dashboard', short: 'Inicio', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { href: '/users', label: 'Usuarios', short: 'Usuarios', icon: Users },
      { href: '/shops', label: 'Tiendas', short: 'Tiendas', icon: Store },
      { href: '/categories', label: 'Categorías', short: 'Categorías', icon: Tag },
    ],
  },
  {
    title: 'Órdenes y Productos',
    items: [
      { href: '/orders', label: 'Órdenes', short: 'Órdenes', icon: ShoppingCart },
      { href: '/products', label: 'Productos', short: 'Productos', icon: Package2 },
    ],
  },
  {
    title: 'Logística',
    items: [
      { href: '/purchases', label: 'Compras', short: 'Compras', icon: ShoppingBag },
      { href: '/packages', label: 'Paquetes', short: 'Paquetes', icon: Package },
      {
        href: '/delivery/prepare',
        label: 'Preparar entregas',
        short: 'Preparar',
        icon: ClipboardList,
      },
      { href: '/delivery', label: 'Entrega', short: 'Entrega', icon: Truck },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/invoices', label: 'Costos de Envío', short: 'Costos', icon: BaggageClaim },
      { href: '/expenses', label: 'Registro de Gastos', short: 'Gastos', icon: ReceiptText },
      { href: '/balance', label: 'Balance General', short: 'Balance', icon: ReceiptIcon },
      { href: '/analytics', label: 'Análisis', short: 'Análisis', icon: ChartColumn },
    ],
  },
];

export const SETTINGS_SECTION: NavSection = {
  href: '/settings',
  label: 'Configuración',
  short: 'Ajustes',
  icon: Settings,
};

/** Solo se llega desde el UserMenu; existe aquí para marcarla activa. */
export const PROFILE_SECTION: NavSection = {
  href: '/profile',
  label: 'Perfil',
  short: 'Perfil',
  icon: User,
};

/** Pie del sidebar / drawer. */
export const SIDEBAR_FOOTER: NavSection[] = [SETTINGS_SECTION];

export const ALL_SECTIONS: NavSection[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  SETTINGS_SECTION,
  PROFILE_SECTION,
];

/**
 * Sección a la que pertenece un pathname: gana el href más específico
 * (p. ej. /delivery/prepare no marca también /delivery), y los
 * detalles (/orders/123) cuentan como su lista.
 */
export function matchSection(pathname: string): NavSection | null {
  let best: NavSection | null = null;
  for (const section of ALL_SECTIONS) {
    const hit =
      pathname === section.href || pathname.startsWith(`${section.href}/`);
    if (hit && (!best || section.href.length > best.href.length)) {
      best = section;
    }
  }
  return best;
}

export function isSectionActive(pathname: string, href: string): boolean {
  return matchSection(pathname)?.href === href;
}

/** Secciones fijas de la barra inferior; el quinto hueco es el menú. */
export const BOTTOM_NAV_SLOTS = 4;

/**
 * Accesos principales por rol: lo que cada perfil abre a diario. Cada
 * href pasa igualmente por canAccessPath, así que si el RBAC cambia el
 * acceso desaparece en vez de mostrar una ruta prohibida.
 */
const BOTTOM_NAV_BY_ROLE: Record<string, readonly string[]> = {
  admin: ['/dashboard', '/orders', '/products', '/delivery'],
  agent: ['/dashboard', '/orders', '/products', '/delivery'],
  accountant: ['/dashboard', '/balance', '/invoices', '/expenses'],
  logistical: ['/dashboard', '/packages', '/delivery/prepare', '/delivery'],
};

/** Relleno por prioridad cuando un rol tiene menos de 4 accesos. */
const BOTTOM_NAV_PRIORITY: readonly string[] = [
  '/dashboard',
  '/orders',
  '/products',
  '/delivery',
  '/packages',
  '/balance',
  '/users',
  '/purchases',
  '/invoices',
  '/expenses',
  '/analytics',
  '/shops',
  '/categories',
];

export function bottomNavItems(role: string | null | undefined): NavSection[] {
  const preferred = (role && BOTTOM_NAV_BY_ROLE[role]) || [];
  const hrefs: string[] = [];
  for (const href of [...preferred, ...BOTTOM_NAV_PRIORITY]) {
    if (hrefs.length >= BOTTOM_NAV_SLOTS) break;
    if (hrefs.includes(href) || !canAccessPath(role, href)) continue;
    hrefs.push(href);
  }
  return hrefs.flatMap((href) => {
    const section = ALL_SECTIONS.find((s) => s.href === href);
    return section ? [section] : [];
  });
}

export interface BottomNavState {
  /** Los accesos fijos del rol (hasta BOTTOM_NAV_SLOTS). */
  items: NavSection[];
  /** Sección a la que pertenece la ruta actual, si es conocida. */
  current: NavSection | null;
  /**
   * La sección actual cuando NO está entre los accesos fijos (Ajustes,
   * Perfil, Usuarios para un contable…): el quinto hueco la muestra
   * activa para que la barra nunca quede sin selección.
   */
  contextual: NavSection | null;
}

export function resolveBottomNav(
  role: string | null | undefined,
  pathname: string
): BottomNavState {
  const items = bottomNavItems(role);
  const current = matchSection(pathname);
  const contextual =
    current && !items.some((item) => item.href === current.href)
      ? current
      : null;
  return { items, current, contextual };
}
