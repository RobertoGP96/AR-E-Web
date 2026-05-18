import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/shops', label: 'Shops' },
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
  { href: '/delivery', label: 'Delivery' },
  { href: '/packages', label: 'Packages' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/categories', label: 'Categories' },
  { href: '/balance', label: 'Balance' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/expenses', label: 'Expenses' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="mb-6 text-lg font-semibold">AR-E Admin</div>
        <nav className="space-y-0.5 text-sm">
          {NAV_ITEMS.map((item) => (
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
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
          <SignOutButton />
        </header>
        <main className="flex-1 bg-zinc-50 p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
