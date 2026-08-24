'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';

/**
 * "Captura" cell: small thumbnail that reveals a larger preview on
 * hover; a muted camera icon when there is no picture yet.
 */
export function PictureHover({
  url,
  alt,
}: {
  url: string | null;
  alt: string;
}) {
  if (!url) {
    return (
      <span
        title="Sin captura"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-default text-muted"
      >
        <Camera className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="group relative inline-block">
      <Image
        src={url}
        alt={alt}
        width={32}
        height={32}
        className="h-8 w-8 rounded-md border border-border object-cover transition-transform duration-150 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
        <Image
          src={url}
          alt={alt}
          width={144}
          height={144}
          className="animate-in fade-in zoom-in-95 duration-150 h-36 w-36 rounded-xl border border-border bg-overlay object-cover shadow-overlay"
        />
      </span>
    </span>
  );
}
