import Image from 'next/image';
import { ShieldAlert } from 'lucide-react';
import { auth } from '@/auth';
import { SignOutButton } from '@/app/(admin)/sign-out-button';

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card animate-in fade-in zoom-in-95 duration-300 w-full max-w-md p-6 text-center sm:p-8">
        <Image
          src="/logo.svg"
          alt="AR-E"
          width={120}
          height={48}
          className="mx-auto mb-6 h-10 w-auto object-contain"
        />
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Acceso restringido
        </h1>
        <p className="mt-2 text-sm text-muted">
          {session?.user
            ? `Tu cuenta (${session.user.role}) no tiene permisos para acceder al panel de administración.`
            : 'No tienes permisos para acceder a esta página.'}
        </p>
        <p className="mt-1 text-sm text-muted/80">
          Si crees que es un error, contacta a un administrador.
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
