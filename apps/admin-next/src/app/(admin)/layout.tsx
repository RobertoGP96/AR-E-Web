import { redirect } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/auth';
import { isStaff } from '@/lib/route-roles';
import { UserMenu } from './user-menu';
import { MobileNav } from './mobile-nav';
import { GlobalSearch } from './global-search';
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

  const { name, email, role } = session.user;

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
          <UserMenu name={name} email={email} role={role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* relative: anchors the mobile strip of GlobalSearch */}
        <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <MobileNav role={role} name={name} email={email} />
          <div className="flex min-w-0 flex-1 items-center">
            <Breadcrumbs />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <GlobalSearch />
            <NotificationsBell />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto scroll-smooth bg-background p-4 sm:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
