import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <SearchX className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          No encontrado
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          El registro que buscas no existe o fue eliminado.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
