'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationItem,
} from './notifications/actions';

const POLL_MS = 60_000;

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-zinc-400',
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const result = await getNotificationsAction();
    if ('error' in result) return;
    setUnread(result.unread);
    setItems(result.items);
  }, []);

  useEffect(() => {
    // Polling an external source (the DB via server action) is the
    // "subscribe to external system" case — state updates land async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      void markNotificationReadAction(item.id).then(() => void refresh());
    }
    setOpen(false);
  }

  function handleMarkAll() {
    void markAllNotificationsReadAction().then(() => void refresh());
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'
        }
        aria-expanded={open}
        className="group relative rounded-xl p-3 text-gray-500 transition-all duration-200 hover:bg-orange-50 hover:text-orange-600"
      >
        <Bell
          className="h-5 w-5 transition-transform group-hover:scale-110"
          aria-hidden
        />
        {unread > 0 ? (
          <>
            <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-orange-500 opacity-75" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 ring-2 ring-white">
              <span className="text-xs font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            </span>
          </>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <span className="text-sm font-medium">Notificaciones</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Marcar todas
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-zinc-500">
                No tienes notificaciones.
              </li>
            ) : (
              items.map((item) => {
                const inner = (
                  <div className="flex gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead
                          ? 'bg-transparent'
                          : (PRIORITY_DOT[item.priority] ?? PRIORITY_DOT.normal)
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div
                        className={`truncate text-sm ${
                          item.isRead
                            ? 'text-zinc-600 dark:text-zinc-400'
                            : 'font-medium text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="line-clamp-2 text-xs text-zinc-500">
                        {item.message}
                      </div>
                    </div>
                  </div>
                );
                const isInternal = item.actionUrl?.startsWith('/') ?? false;
                return (
                  <li
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    {isInternal && item.actionUrl ? (
                      <Link
                        href={item.actionUrl}
                        onClick={() => handleItemClick(item)}
                        className="block px-3 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="block w-full px-3 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
