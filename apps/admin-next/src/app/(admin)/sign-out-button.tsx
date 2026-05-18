'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    startTransition(() => {
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
