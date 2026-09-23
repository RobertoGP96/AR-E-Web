'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { Button } from '@heroui/react';
import { AppModal } from '@/components/ui';

export interface DetailPhoto {
  url: string;
  alt: string;
}

interface DetailPhotosProps {
  /** Fotos en orden; las entradas sin URL se ignoran. */
  photos: (DetailPhoto | { url: string | null | undefined; alt: string })[];
  /** Etiqueta de la tira y título del visor (p. ej. «Fotos del paquete»). */
  label?: string;
  className?: string;
}

/**
 * Tira compacta de fotos para las cabeceras de detalle: miniaturas de
 * tamaño FIJO (la cabecera nunca crece con la foto, por muy alta que
 * sea) que abren un visor modal a tamaño completo con navegación
 * anterior/siguiente (botones y flechas del teclado).
 */
export function DetailPhotos({ photos, label = 'Fotos', className }: DetailPhotosProps) {
  const list = photos.filter((p): p is DetailPhoto => Boolean(p.url));
  const [active, setActive] = useState<number | null>(null);
  const count = list.length;

  useEffect(() => {
    if (active === null || count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? i : (i + 1) % count));
      if (e.key === 'ArrowLeft') setActive((i) => (i === null ? i : (i + count - 1) % count));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, count]);

  if (count === 0) return null;
  const current = active === null ? null : list[active];

  return (
    <div className={['flex flex-wrap items-center gap-x-4 gap-y-2', className].filter(Boolean).join(' ')}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <Images className="h-3.5 w-3.5" aria-hidden />
        {label}
        {count > 1 ? <span className="normal-case tracking-normal">· {count}</span> : null}
      </span>
      <div className="flex items-center gap-2">
        {list.map((p, i) => (
          <button
            key={`${p.url}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver ${p.alt}`}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-default shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:h-24 sm:w-24"
          >
            <Image
              src={p.url}
              alt={p.alt}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {count > 1 ? (
              <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                {i + 1}/{count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <AppModal
        isOpen={current !== null}
        onClose={() => setActive(null)}
        title={
          current && active !== null
            ? count > 1
              ? `${label} · ${active + 1} de ${count}`
              : label
            : label
        }
        size="lg"
      >
        {current ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border bg-default">
              <Image
                key={current.url}
                src={current.url}
                alt={current.alt}
                width={1200}
                height={900}
                sizes="(max-width: 640px) 100vw, 800px"
                className="animate-in fade-in duration-200 h-auto max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
            {count > 1 ? (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setActive((i) => (i === null ? i : (i + count - 1) % count))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Anterior
                </Button>
                <div className="flex items-center gap-1.5">
                  {list.map((p, i) => (
                    <button
                      key={`${p.url}-thumb-${i}`}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Ir a la foto ${i + 1}`}
                      aria-current={i === active ? 'true' : undefined}
                      className={[
                        'relative h-10 w-10 overflow-hidden rounded-md border transition-colors',
                        i === active
                          ? 'border-accent ring-2 ring-accent/40'
                          : 'border-border opacity-70 hover:opacity-100',
                      ].join(' ')}
                    >
                      <Image src={p.url} alt="" fill sizes="40px" className="object-cover" />
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setActive((i) => (i === null ? i : (i + 1) % count))}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}
