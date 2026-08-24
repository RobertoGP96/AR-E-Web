'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';

/**
 * "Captura" cell: small thumbnail that reveals a larger preview on
 * hover (the Vite admin's HoverCard pattern); a muted camera icon when
 * there is no picture yet.
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
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-400"
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
        className="h-8 w-8 rounded-md border border-border object-cover"
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
        <Image
          src={url}
          alt={alt}
          width={128}
          height={128}
          className="h-32 w-32 rounded-lg border border-border bg-white object-cover shadow-xl"
        />
      </span>
    </span>
  );
}
