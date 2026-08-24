import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { buttonVariants } from '@heroui/styles';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card animate-in fade-in zoom-in-95 duration-300 w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <SearchX className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-muted">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: 'primary' })}
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
