'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/pagination';

/**
 * "Mostrar N filas de X" pagination bar, ported from the Vite admin's
 * TablePagination + its orange-accented pagination buttons. URL-driven:
 * writes ?page= and ?per= preserving the other filters.
 */
export function TablePagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);

  function apply(nextPage: number, nextPer: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) params.set('page', String(nextPage));
    else params.delete('page');
    if (nextPer !== DEFAULT_PAGE_SIZE) params.set('per', String(nextPer));
    else params.delete('per');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  // Up to 5 page numbers with ellipsis, like the original.
  function pageItems(): (number | 'ellipsis')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (current <= 3) return [1, 2, 3, 4, 'ellipsis', totalPages];
    if (current >= totalPages - 2) {
      return [
        1,
        'ellipsis',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
  }

  const btnBase =
    'inline-flex h-9 items-center justify-center rounded-md text-sm font-medium transition hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50';

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Mostrar</span>
        <select
          value={perPage}
          onChange={(e) => apply(1, Number(e.target.value))}
          className="h-8 w-[70px] rounded-md border border-input bg-white px-2 text-sm"
          aria-label="Filas por página"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>filas de {total}</span>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Paginación" className="mx-0 w-auto">
          <ul className="flex flex-row items-center gap-1">
            <li>
              <button
                type="button"
                onClick={() => apply(current - 1, perPage)}
                disabled={current === 1}
                aria-label="Ir a la página anterior"
                className={`${btnBase} gap-1 px-2.5 pl-2.5`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            </li>
            {pageItems().map((item, i) =>
              item === 'ellipsis' ? (
                <li
                  key={`e${i}`}
                  className="hidden h-9 w-9 items-center justify-center sm:flex"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Más páginas</span>
                </li>
              ) : (
                <li key={item} className="hidden sm:block">
                  <button
                    type="button"
                    onClick={() => apply(item, perPage)}
                    aria-current={item === current ? 'page' : undefined}
                    className={`${btnBase} w-9 ${
                      item === current
                        ? 'border border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : ''
                    }`}
                  >
                    {item}
                  </button>
                </li>
              )
            )}
            <li className="sm:hidden">
              <span className="inline-flex h-9 items-center px-2 text-sm tabular-nums text-muted-foreground">
                {current} / {totalPages}
              </span>
            </li>
            <li>
              <button
                type="button"
                onClick={() => apply(current + 1, perPage)}
                disabled={current === totalPages}
                aria-label="Ir a la página siguiente"
                className={`${btnBase} gap-1 px-2.5 pr-2.5`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
