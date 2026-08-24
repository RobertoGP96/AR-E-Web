'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card animate-in fade-in zoom-in-95 duration-300 w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-soft-foreground">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo; si el
          problema persiste, contacta a un administrador.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted/70">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onPress={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: 'outline' })}
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
