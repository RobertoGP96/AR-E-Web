import { redirect } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/auth';
import { isStaff } from '@/lib/route-roles';
import { SignOutButton } from './sign-out-button';
import { MobileNav } from './mobile-nav';
import { NotificationsBell } from './notifications-bell';
import { AdminNav } from './admin-nav';
import { Breadcrumbs } from './breadcrumbs';

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

  const { name, role } = session.user;
  const initials = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — near-black with orange accents, like the Vite admin */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center justify-center border-b border-orange-400 p-4">
          <Image
            src="/logo.svg"
            alt="AR&E Shipps"
            width={150}
            height={56}
            priority
            className="h-12 w-auto object-contain"
          />
        </div>
        <AdminNav role={role} />
        <div className="border-t border-orange-400 p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-sm font-semibold text-gray-900">
              {initials || 'AR'}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{name}</div>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-sidebar-foreground/80">
                {role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:h-20 sm:px-6">
          <MobileNav role={role} />
          <div className="flex min-w-0 flex-1 items-center">
            <Breadcrumbs />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell />
            <SignOutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto bg-background p-3 sm:p-6 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
