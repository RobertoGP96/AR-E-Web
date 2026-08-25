'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@heroui/react';

import { NativeSelect } from '@/components/ui';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/pagination';

/**
 * "Mostrar N filas de X" bar + HeroUI pagination. URL-driven: writes
 * ?page= and ?per= preserving the other filters. Same public API as
 * the pre-redesign version.
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

  // Up to 5 page numbers with ellipsis.
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
    return [
      1,
      'ellipsis',
      current - 1,
      current,
      current + 1,
      'ellipsis',
      totalPages,
    ];
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>Mostrar</span>
        <NativeSelect
          value={perPage}
          onChange={(e) => apply(1, Number(e.target.value))}
          className="h-8 w-[74px] px-2 py-1"
          aria-label="Filas por página"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </NativeSelect>
        <span>filas de {total}</span>
      </div>

      {totalPages > 1 ? (
        <Pagination aria-label="Paginación">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                onPress={() => apply(current - 1, perPage)}
                isDisabled={current === 1}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {pageItems().map((item, i) =>
              item === 'ellipsis' ? (
                <Pagination.Item key={`e${i}`} className="hidden sm:block">
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={item} className="hidden sm:block">
                  <Pagination.Link
                    isActive={item === current}
                    onPress={() => apply(item, perPage)}
                  >
                    {item}
                  </Pagination.Link>
                </Pagination.Item>
              )
            )}
            <Pagination.Item className="sm:hidden">
              <span className="inline-flex h-9 items-center px-2 text-sm tabular-nums text-muted">
                {current} / {totalPages}
              </span>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next
                onPress={() => apply(current + 1, perPage)}
                isDisabled={current === totalPages}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ) : null}
    </div>
  );
}
