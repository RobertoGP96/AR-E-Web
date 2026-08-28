'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Button } from '@heroui/react';
import { AppModal } from '@/components/ui';

/**
 * "Captura" cell: small thumbnail that reveals a larger preview on
 * hover and opens a full-size viewer modal on press (the touch path,
 * where hover does not exist); a muted camera icon when there is no
 * picture yet.
 */
export function PictureHover({
  url,
  alt,
}: {
  url: string | null;
  alt: string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);

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
    // stopPropagation: the thumbnail lives inside clickable MobileCards
    // (row navigation) — a tap here must open the viewer, not navigate.
    <span
      className="group relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Ver ${alt}`}
        onPress={() => setViewerOpen(true)}
        className="h-8 w-8 min-w-0 overflow-hidden rounded-md border border-border p-0"
      >
        <Image
          src={url}
          alt={alt}
          width={32}
          height={32}
          className="h-8 w-8 object-cover transition-transform duration-150 group-hover:scale-105"
        />
      </Button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
        <Image
          src={url}
          alt={alt}
          width={144}
          height={144}
          className="animate-in fade-in zoom-in-95 duration-150 h-36 w-36 rounded-xl border border-border bg-overlay object-cover shadow-overlay"
        />
      </span>
      <AppModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={alt}
        size="md"
      >
        <Image
          src={url}
          alt={alt}
          width={640}
          height={640}
          className="h-auto w-full rounded-xl border border-border bg-default object-contain"
        />
      </AppModal>
    </span>
  );
}
