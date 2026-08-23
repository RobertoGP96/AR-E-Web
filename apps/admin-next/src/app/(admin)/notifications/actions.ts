'use server';

import { prisma } from '@/lib/prisma';
import { requireStaff, parseId } from '@/lib/action-helpers';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPayload {
  unread: number;
  items: NotificationItem[];
}

/**
 * Latest notifications for the signed-in user. Django (backend signals)
 * creates the rows; this app only reads them and flips is_read.
 */
export async function getNotificationsAction(): Promise<
  NotificationsPayload | { error: string }
> {
  const { denied, user } = await requireStaff();
  if (denied) return { error: denied.error };
  const userId = parseId(user.id);
  if (!userId) return { error: 'Invalid session' };

  const now = new Date();
  const notExpired = {
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [unread, items] = await Promise.all([
    prisma.notification.count({
      where: { recipientId: userId, isRead: false, ...notExpired },
    }),
    prisma.notification.findMany({
      where: { recipientId: userId, ...notExpired },
      select: {
        id: true,
        title: true,
        message: true,
        priority: true,
        actionUrl: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    unread,
    items: items.map((n) => ({
      id: n.id.toString(),
      title: n.title,
      message: n.message,
      priority: n.priority,
      actionUrl: n.actionUrl,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markNotificationReadAction(
  id: string
): Promise<ActionResult> {
  const { denied, user } = await requireStaff();
  if (denied) return denied;
  const userId = parseId(user.id);
  const notificationId = parseId(id);
  if (!userId || !notificationId) {
    return { ok: false, error: 'Invalid id' };
  }

  // Scoped to the recipient — you cannot mark someone else's as read.
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId },
    data: { isRead: true, readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { denied, user } = await requireStaff();
  if (denied) return denied;
  const userId = parseId(user.id);
  if (!userId) return { ok: false, error: 'Invalid session' };

  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { ok: true };
}
