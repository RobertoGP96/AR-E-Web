'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@heroui/react';

/**
 * Barra fija sobre un documento imprimible. Desaparece al imprimir; el
 * documento se guarda como PDF desde el propio diálogo del navegador.
 */
export function PrintToolbar({
  backHref,
  backLabel = 'Volver',
  title,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-2.5">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
        <span className="hidden truncate text-sm font-medium text-foreground sm:block">
          {title}
        </span>
        <Button variant="primary" size="sm" onPress={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir / PDF
        </Button>
      </div>
    </div>
  );
}
