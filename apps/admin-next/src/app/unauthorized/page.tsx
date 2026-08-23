import Image from 'next/image';
import { ShieldAlert } from 'lucide-react';
import { auth } from '@/auth';
import { SignOutButton } from '@/app/(admin)/sign-out-button';

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <Image
          src="/logo.svg"
          alt="AR-E"
          width={120}
          height={48}
          className="mx-auto mb-6 h-10 w-auto object-contain"
        />
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Acceso restringido
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {session?.user
            ? `Tu cuenta (${session.user.role}) no tiene permisos para acceder al panel de administración.`
            : 'No tienes permisos para acceder a esta página.'}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Si crees que es un error, contacta a un administrador.
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
