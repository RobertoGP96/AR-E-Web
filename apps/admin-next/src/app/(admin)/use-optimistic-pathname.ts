'use client';

import { useState, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ruta "optimista" para los menús: al hacer clic en un enlace la
 * sección pulsada se marca activa de inmediato, sin esperar a que el
 * servidor responda (el esqueleto de `loading.tsx` cubre el contenido
 * mientras tanto). Cuando la URL real cambia, la selección se
 * re-sincroniza durante el render (mismo patrón que SettingsNav).
 *
 * Clics con modificador (nueva pestaña) o botón secundario no cambian
 * la URL de esta pestaña, así que no se anticipan.
 */
export function useOptimisticPathname(): [
  pathname: string,
  onNavigate: (href: string, event: MouseEvent<HTMLAnchorElement>) => void,
] {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setPending(null);
  }

  function onNavigate(href: string, event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    setPending(href === pathname ? null : href);
  }

  return [pending ?? pathname, onNavigate];
}
