'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { resolveBottomNav } from '@/lib/navigation';
import { useMobileNav } from './mobile-nav-context';
import { useOptimisticPathname } from './use-optimistic-pathname';

const CHIP_BASE =
  'flex w-full flex-col items-center gap-1 rounded-[1.25rem] px-1 py-2 text-[10px] font-medium leading-none transition-all duration-200';
const CHIP_ACTIVE = 'bg-accent text-white shadow-md shadow-accent/35';
const CHIP_IDLE = 'text-sidebar-foreground/70 hover:text-white active:scale-95';

/**
 * Barra inferior flotante (solo móvil): 4 accesos fijos según el rol
 * + un quinto hueco que abre el drawer con todas las secciones. Ese
 * hueco es contextual: cuando la ruta actual no es uno de los accesos
 * fijos (Ajustes, Perfil, Usuarios para un contable…) muestra esa
 * sección activa, así la barra siempre refleja dónde está el usuario.
 *
 * Feedback de navegación: la sección pulsada se marca activa al
 * instante (ruta optimista) y el contenido lo cubre el esqueleto de la
 * ruta destino — nada de spinners en el menú.
 *
 * The view-transition-name keeps the bar out of the page enter/exit
 * animation (template.tsx) — without it the animating page paints over
 * the bar and it flickers on every navigation. See globals.css.
 */
export function BottomNav({ role }: { role: string }) {
  const [pathname, markPending] = useOptimisticPathname();
  const { setOpen } = useMobileNav();
  const { items, current, contextual } = resolveBottomNav(role, pathname);

  if (items.length === 0) return null;

  const MenuIcon = contextual?.icon ?? LayoutGrid;

  return (
    <nav
      aria-label="Navegación rápida"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 [view-transition-name:bottom-nav] md:hidden"
    >
      {/* Glass: fondo translúcido + blur fuerte del contenido que pasa debajo */}
      <ul className="pointer-events-auto flex w-full max-w-sm items-stretch justify-between gap-1 rounded-[1.625rem] border border-white/10 bg-sidebar/80 p-1.5 shadow-[0_10px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current?.href === item.href;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                onClick={(event) => markPending(item.href, event)}
                aria-current={active ? 'page' : undefined}
                className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                    active ? 'scale-110' : ''
                  }`}
                  aria-hidden
                />
                <span className="max-w-full truncate">{item.short}</span>
              </Link>
            </li>
          );
        })}

        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={
              contextual
                ? `Estás en ${contextual.label}. Abrir todas las secciones`
                : 'Abrir todas las secciones'
            }
            aria-current={contextual ? 'page' : undefined}
            className={`${CHIP_BASE} ${contextual ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            <MenuIcon
              className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                contextual ? 'scale-110' : ''
              }`}
              aria-hidden
            />
            <span className="max-w-full truncate">
              {contextual ? contextual.short : 'Más'}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
