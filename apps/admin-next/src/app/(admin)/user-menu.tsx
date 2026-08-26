'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react';
import { Dropdown, Separator, Spinner } from '@heroui/react';

/**
 * User menu anchored to the sidebar avatar block. Hosts the shortcuts
 * that used to live elsewhere: Perfil (aside bottom nav) and Cerrar
 * sesión (topbar button).
 */
export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email?: string | null;
  role: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ callbackUrl: '/login' });
    });
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Menú de usuario"
        isDisabled={isPending}
        className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-hover data-[pressed]:bg-sidebar-hover"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-warning text-sm font-bold text-sidebar shadow-sm">
          {isPending ? <Spinner size="sm" aria-hidden /> : initials || 'AR'}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold">{name}</div>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium capitalize text-sidebar-foreground/80">
            {role}
          </span>
        </div>
        <ChevronsUpDown
          className="h-4 w-4 shrink-0 text-sidebar-foreground/60"
          aria-hidden
        />
      </Dropdown.Trigger>

      <Dropdown.Popover placement="top start" className="w-60">
        <div className="border-b border-separator px-3 py-2.5">
          <div className="truncate text-sm font-semibold text-foreground">
            {name}
          </div>
          {email ? (
            <div className="truncate text-xs text-muted">{email}</div>
          ) : null}
        </div>
        <Dropdown.Menu aria-label="Opciones de usuario">
          <Dropdown.Item
            id="profile"
            textValue="Perfil"
            onAction={() => router.push('/profile')}
          >
            <User className="h-4 w-4" aria-hidden />
            Perfil
          </Dropdown.Item>
          <Dropdown.Item
            id="settings"
            textValue="Configuración"
            onAction={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" aria-hidden />
            Configuración
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item
            id="sign-out"
            variant="danger"
            textValue="Cerrar sesión"
            onAction={handleSignOut}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {isPending ? 'Cerrando…' : 'Cerrar sesión'}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
