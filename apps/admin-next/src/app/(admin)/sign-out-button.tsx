'use client';

import { useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';
import { Button, Tooltip } from '@heroui/react';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ callbackUrl: '/login' });
    });
  }

  return (
    <Tooltip delay={600}>
      <Button
        variant="outline"
        onPress={handleSignOut}
        isDisabled={isPending}
        aria-label="Cerrar sesión"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden />
        )}
        <span className="hidden sm:inline">
          {isPending ? 'Cerrando…' : 'Cerrar sesión'}
        </span>
      </Button>
      <Tooltip.Content className="sm:hidden">Cerrar sesión</Tooltip.Content>
    </Tooltip>
  );
}
