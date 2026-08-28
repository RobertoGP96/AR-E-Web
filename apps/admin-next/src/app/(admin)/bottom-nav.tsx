'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Package,
  Truck,
  ReceiptIcon,
  Users,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { canAccessPath } from '@/lib/route-roles';

interface BottomNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Priority-ordered candidates: each role sees the first five sections it
 * can open, so the bar stays useful for admin, agent, accountant and
 * logistical without a per-role config.
 */
const CANDIDATES: BottomNavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Órdenes', href: '/orders', icon: ShoppingCart },
  { name: 'Productos', href: '/products', icon: Package2 },
  { name: 'Entrega', href: '/delivery', icon: Truck },
  { name: 'Paquetes', href: '/packages', icon: Package },
  { name: 'Balance', href: '/balance', icon: ReceiptIcon },
  { name: 'Usuarios', href: '/users', icon: Users },
  { name: 'Compras', href: '/purchases', icon: ShoppingBag },
];

/**
 * Floating bottom navigation (mobile only): a detached rounded pill over
 * the brand near-black, with the active section highlighted as an orange
 * accent chip. The full section list stays in the header drawer
 * (MobileNav); this bar is the quick path to the everyday sections.
 *
 * The view-transition-name keeps the bar out of the page enter/exit
 * animation (template.tsx) — without it the animating page paints over
 * the bar and it flickers on every navigation. See globals.css.
 */
export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();

  const items = CANDIDATES.filter((item) =>
    canAccessPath(role, item.href)
  ).slice(0, 5);

  if (items.length === 0) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Navegación rápida"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 [view-transition-name:bottom-nav] md:hidden"
    >
      <ul className="pointer-events-auto flex w-full max-w-sm items-stretch justify-between gap-1 rounded-[1.625rem] border border-white/10 bg-sidebar/95 p-1.5 shadow-[0_10px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-[1.25rem] px-1 py-2 text-[10px] font-medium leading-none transition-all duration-200 ${
                  active
                    ? 'bg-accent text-white shadow-md shadow-accent/35'
                    : 'text-sidebar-foreground/70 hover:text-white active:scale-95'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                    active ? 'scale-110' : ''
                  }`}
                  aria-hidden
                />
                <span className="max-w-full truncate">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
