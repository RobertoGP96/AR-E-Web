'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo; si el
          problema persiste, contacta a un administrador.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-zinc-400">Ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reintentar
        </button>
      </div>
    </div>
  );
}
