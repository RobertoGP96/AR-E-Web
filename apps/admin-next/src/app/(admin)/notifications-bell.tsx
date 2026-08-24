'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Button, Popover } from '@heroui/react';
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationItem,
} from './notifications/actions';

const POLL_MS = 60_000;

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-danger',
  high: 'bg-accent',
  normal: 'bg-warning',
  low: 'bg-muted/50',
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

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
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        isIconOnly
        aria-label={
          unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'
        }
        className="group relative overflow-visible"
      >
        <Bell
          className="h-5 w-5 transition-transform duration-150 group-hover:scale-110"
          aria-hidden
        />
        {unread > 0 ? (
          <>
            <span className="absolute -right-0.5 -top-0.5 h-5 w-5 animate-ping rounded-full bg-accent opacity-60" />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-accent to-warning ring-2 ring-background">
              <span className="text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            </span>
          </>
        ) : null}
      </Button>

      <Popover.Content
        placement="bottom end"
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
      >
        <Popover.Dialog className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-separator px-3 py-2.5">
            <span className="text-sm font-semibold text-foreground">
              Notificaciones
            </span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-default hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Marcar todas
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-default text-muted">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm text-muted">
                  No tienes notificaciones.
                </span>
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
                            ? 'text-muted'
                            : 'font-medium text-foreground'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="line-clamp-2 text-xs text-muted">
                        {item.message}
                      </div>
                    </div>
                  </div>
                );
                const isInternal = item.actionUrl?.startsWith('/') ?? false;
                return (
                  <li
                    key={item.id}
                    className="border-b border-separator last:border-0"
                  >
                    {isInternal && item.actionUrl ? (
                      <Link
                        href={item.actionUrl}
                        onClick={() => handleItemClick(item)}
                        className="block px-3 py-2.5 transition-colors hover:bg-surface-hover"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
