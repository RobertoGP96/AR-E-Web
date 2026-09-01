'use client';

import type { ReactNode } from 'react';

/** Posición del ranking: los tres primeros llevan medalla accent. */
function RankBadge({ pos }: { pos: number }) {
  const top3 = pos <= 3;
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
        top3 ? 'bg-accent-soft text-accent' : 'bg-default text-muted'
      }`}
      aria-hidden
    >
      {pos}
    </span>
  );
}

export interface RankItem {
  id: string;
  title: ReactNode;
  sub?: ReactNode;
  value: ReactNode;
  extra?: ReactNode;
  media?: ReactNode;
}

/**
 * Lista clasificada (top clientes/agentes/tiendas): posición, medio
 * opcional (avatar), título + detalle y valor a la derecha.
 */
export function RankList({
  items,
  emptyMessage,
}: {
  items: RankItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }
  return (
    <ol className="divide-y divide-separator">
      {items.map((item, i) => (
        <li
          key={item.id}
          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <RankBadge pos={i + 1} />
          {item.media}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {item.title}
            </p>
            {item.sub ? (
              <p className="truncate text-xs text-muted">{item.sub}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {item.value}
            </p>
            {item.extra ? <div className="mt-0.5">{item.extra}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
