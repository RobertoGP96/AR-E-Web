'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="surface-card animate-in fade-in zoom-in-95 duration-300 w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <SearchX className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          No encontrado
        </h1>
        <p className="mt-2 text-sm text-muted">
          El registro que buscas no existe o fue eliminado.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: 'primary' })}
          >
            Ir al dashboard
          </Link>
          <Button variant="outline" onPress={() => router.back()}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
