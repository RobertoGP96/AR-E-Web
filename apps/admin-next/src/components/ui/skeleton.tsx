import { cn } from '@heroui/react';

/**
 * Bloques de esqueleto para los `loading.tsx` del panel: mismas formas
 * que PageHeader / StatCard / surface-card / ResponsiveTable, en gris
 * pulsante. Se pintan al instante en la navegación mientras el
 * servidor consulta la BD.
 *
 * En Next 16 el límite de `loading.tsx` NO se vuelve a mostrar cuando
 * solo cambian los search params (filtros, paginación): el segmento se
 * clava sin ellos y el RSC nuevo se difiere sobre el anterior. Por eso
 * todas las listas pueden tener esqueleto sin parpadear al filtrar.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-default', className)}
    />
  );
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mb-6 flex items-center gap-3', className)}>
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64 max-w-[60vw]" />
      </div>
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('surface-card space-y-3 p-5', className)}>
      <Skeleton className="h-4 w-36" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Página genérica: cabecera + tarjeta de contenido. */
export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="pb-8">
      <PageHeaderSkeleton />
      <CardSkeleton rows={rows} />
    </div>
  );
}

/** Barra de herramientas de lista: buscador + botón "Filtrar". */
export function ToolbarSkeleton({
  search = true,
  filter = true,
}: {
  search?: boolean;
  filter?: boolean;
}) {
  if (!search && !filter) return null;
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      {search ? (
        <Skeleton className="h-10 w-full rounded-lg lg:max-w-xs" />
      ) : null}
      {filter ? <Skeleton className="h-10 w-24 rounded-lg" /> : null}
    </div>
  );
}

/** Tarjeta móvil (MobileCard): título, badge y tres filas etiqueta/valor. */
export function MobileCardSkeleton() {
  return (
    <div className="surface-card border-l-4 border-l-default p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2.5 border-t border-separator pt-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tabla de datos (ResponsiveTable): cabecera + filas en escritorio,
 * pila de tarjetas en móvil. `columns` debe aproximar las columnas
 * reales para que el esqueleto ocupe el mismo ancho que la tabla.
 */
export function TableSkeleton({
  columns = 6,
  rows = 8,
  cards = 4,
}: {
  columns?: number;
  rows?: number;
  cards?: number;
}) {
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const cols = Array.from({ length: columns }, (_, i) => i);
  return (
    <>
      <div className="surface-card hidden overflow-hidden md:block">
        <div
          className="grid gap-4 bg-default/40 px-4 py-3"
          style={grid}
        >
          {cols.map((c) => (
            <Skeleton key={c} className="h-2.5 w-3/5" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="grid gap-4 border-t border-separator px-4 py-3.5"
            style={grid}
          >
            {cols.map((c) => (
              <Skeleton
                key={c}
                className={cn(
                  'h-3.5',
                  c === 0 ? 'w-11/12' : c % 3 === 2 ? 'w-1/2' : 'w-3/4'
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: cards }, (_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

/** Barra "Mostrar N filas" + paginación (TablePagination). */
export function PaginationSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-8 w-44 rounded-lg" />
      <Skeleton className="h-8 w-56 rounded-lg" />
    </div>
  );
}

/**
 * Página de lista estándar: cabecera, toolbar (buscador/filtros),
 * tabla y paginación. Es el `loading.tsx` de todas las secciones con
 * tabla; ajusta `columns` a la tabla real de cada una.
 */
export function ListPageSkeleton({
  columns = 6,
  rows = 8,
  search = true,
  filter = true,
  pagination = true,
}: {
  columns?: number;
  rows?: number;
  search?: boolean;
  filter?: boolean;
  pagination?: boolean;
}) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-5 pb-8">
      <PageHeaderSkeleton className="mb-0" />
      <ToolbarSkeleton search={search} filter={filter} />
      <TableSkeleton columns={columns} rows={rows} />
      {pagination ? <PaginationSkeleton /> : null}
    </div>
  );
}
