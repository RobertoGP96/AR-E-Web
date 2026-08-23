import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { isStaff, visibleNavItems, type NavItem } from '@/lib/route-roles';
import { SignOutButton } from './sign-out-button';
import { MobileNav } from './mobile-nav';
import { NotificationsBell } from './notifications-bell';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/shops', label: 'Shops' },
  { href: '/orders', label: 'Orders' },
  { href: '/products', label: 'Products' },
  { href: '/delivery', label: 'Delivery' },
  { href: '/packages', label: 'Packages' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/categories', label: 'Categories' },
  { href: '/balance', label: 'Balance' },
  { href: '/client-balances', label: 'Client balances' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/settings', label: 'Settings' },
  { href: '/profile', label: 'Profile' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  // Second RBAC layer (proxy.ts is the first): customers of the client
  // app share the same user table — never let non-staff roles in.
  if (!isStaff(session.user.role)) {
    redirect('/unauthorized');
  }

  const navItems = visibleNavItems(NAV_ITEMS, session.user.role);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="mb-6 text-lg font-semibold">AR-E Admin</div>
        <nav className="space-y-0.5 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <MobileNav items={navItems} />
            <div className="flex items-center gap-2 text-sm">
              <span className="max-w-[40vw] truncate text-zinc-900 sm:max-w-none dark:text-zinc-100">
                {session.user.name}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {session.user.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationsBell />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 bg-zinc-50 p-4 sm:p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
