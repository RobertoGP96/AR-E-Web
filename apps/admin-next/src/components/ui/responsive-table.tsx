import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Standard responsive data view: a real table inside a scrollable
 * surface on >=md, a stack of MobileCard items below. Pass the <table>
 * markup (with the .data-table class) as `table` and the card list as
 * `cards`.
 */
export function ResponsiveTable({
  table,
  cards,
}: {
  table: ReactNode;
  cards: ReactNode;
}) {
  return (
    <>
      <div className="surface-card hidden overflow-x-auto md:block">
        {table}
      </div>
      <div className="stagger-children space-y-3 md:hidden">{cards}</div>
    </>
  );
}

/**
 * Mobile representation of a table row: orange-edged card with title,
 * badges, labelled rows and an actions strip — the app-wide mobile
 * pattern (heir of the Vite admin's MobileDataCard).
 */
export function MobileCard({
  title,
  subtitle,
  media,
  badges,
  rows,
  actions,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  media?: ReactNode;
  badges?: ReactNode;
  rows?: { icon?: LucideIcon; label: string; value: ReactNode }[];
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`surface-card border-l-4 border-l-accent p-4 transition-shadow ${
        onClick ? 'cursor-pointer active:scale-[0.995] hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {media}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
            </p>
            {subtitle ? (
              <p className="truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {badges ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {badges}
          </div>
        ) : null}
      </div>

      {rows && rows.length > 0 ? (
        <dl className="mt-3 space-y-1.5 border-t border-separator pt-3">
          {rows.map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <dt className="flex items-center gap-1.5 text-muted">
                  {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
                  {row.label}
                </dt>
                <dd className="text-right font-medium tabular-nums text-foreground">
                  {row.value}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      {actions ? (
        <div
          className="mt-3 flex items-center justify-end gap-1 border-t border-separator pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Standard table empty message (spans all columns). */
export function TableEmpty({
  colSpan,
  icon: Icon,
  message,
}: {
  colSpan: number;
  icon?: LucideIcon;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          {Icon ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-default text-muted">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          ) : null}
          <p className="text-sm text-muted">{message}</p>
        </div>
      </td>
    </tr>
  );
}
