'use client';

import { useLinkStatus } from 'next/link';
import { Loader2 } from 'lucide-react';

/**
 * Indicador inline de navegación en curso — debe ir DENTRO de un
 * <Link>. Las secciones con filtros por URL no tienen loading.tsx (su
 * esqueleto parpadearía en cada filtro), así que sin esto un clic en
 * el menú no da ninguna señal hasta que el servidor responde.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <Loader2
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 animate-spin opacity-80 ${className ?? ''}`}
    />
  );
}
