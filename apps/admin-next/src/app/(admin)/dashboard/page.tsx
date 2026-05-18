import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Welcome, {session?.user.name}. This is the Next.js admin panel
        backed by Prisma + Neon. Pages below will be progressively ported from{' '}
        <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-800">
          apps/admin
        </code>
        .
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          'Users',
          'Shops',
          'Products',
          'Orders',
          'Delivery',
          'Packages',
          'Purchases',
          'Categories',
          'Balance',
          'Analytics',
          'Invoices',
          'Expenses',
        ].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pending port
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
