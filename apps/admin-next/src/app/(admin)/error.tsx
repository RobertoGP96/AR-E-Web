'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

/**
 * Error boundary del área autenticada: captura fallos de cualquier
 * página SIN desmontar el shell (sidebar, header, bottom nav), así el
 * usuario puede reintentar o irse a otra sección. El error.tsx de la
 * raíz queda solo para fallos del propio layout.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] page error', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="surface-card animate-in fade-in zoom-in-95 duration-300 w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-soft-foreground">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          No se pudo cargar esta sección
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ocurrió un error inesperado al cargar la página. Puedes
          reintentar; si persiste, contacta a un administrador.
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
