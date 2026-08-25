import { ViewTransition } from 'react';

/**
 * Remounts on every section change inside (admin) — search-param-only
 * navigations (filters, pagination) do NOT remount, so typing in a
 * SearchInput never replays the animation. The enter/exit classes are
 * animated in globals.css under "View transitions".
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
