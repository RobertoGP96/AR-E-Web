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
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — the black third of the black/orange/white identity */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-4">
          <Image
            src="/logo.svg"
            alt="AR&E Shipps"
            width={150}
            height={56}
            priority
            className="h-11 w-auto object-contain"
          />
        </div>
        <AdminNav role={role} />
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-sidebar-hover">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-warning text-sm font-bold text-sidebar shadow-sm">
              {initials || 'AR'}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{name}</div>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium capitalize text-sidebar-foreground/80">
                {role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <MobileNav role={role} />
          <div className="flex min-w-0 flex-1 items-center">
            <Breadcrumbs />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationsBell />
            <SignOutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto scroll-smooth bg-background p-4 sm:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
