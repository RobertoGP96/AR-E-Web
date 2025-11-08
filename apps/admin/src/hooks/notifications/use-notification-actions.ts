/**
 * Hook para acciones de notificaciones (marcar como leída, eliminar, etc.)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Notification, MarkAsReadData } from '../../types/models';
import {
  markAsRead,
  markAsUnread,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  deleteAllNotifications
} from '../../services/notifications';

interface UseNotificationActionsReturn {
  // Mutaciones para marcar como leída/no leída
  markAsRead: {
    mutate: (id: number) => void;
    isPending: boolean;
  };
  markAsUnread: {
    mutate: (id: number) => void;
    isPending: boolean;
  };
  markMultipleAsRead: {
    mutate: (data: MarkAsReadData) => void;
    isPending: boolean;
  };
  markAllAsRead: {
    mutate: () => void;
    isPending: boolean;
  };

  // Mutaciones para eliminar
  deleteNotification: {
    mutate: (id: number) => void;
    isPending: boolean;
  };
  deleteReadNotifications: {
    mutate: () => void;
    isPending: boolean;
  };
  deleteAllNotifications: {
    mutate: () => void;
    isPending: boolean;
  };
}

export const useNotificationActions = (): UseNotificationActionsReturn => {
  const queryClient = useQueryClient();

  // Marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: (notification: Notification) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Notificación marcada como leída', {
        description: notification.title,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al marcar notificación como leída', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Marcar como no leída
  const markAsUnreadMutation = useMutation({
    mutationFn: (id: number) => markAsUnread(id),
    onSuccess: (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Notificación marcada como no leída', {
        description: notification.title,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al marcar notificación como no leída', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Marcar múltiples como leídas
  const markMultipleAsReadMutation = useMutation({
    mutationFn: (data: MarkAsReadData) => markMultipleAsRead(data),
    onSuccess: (response: { success: boolean; message: string; count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const count = response?.count || 0;
      toast.success(`${count} notificaciones marcadas como leídas`);
    },
    onError: (error: Error) => {
      toast.error('Error al marcar notificaciones como leídas', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: (response: { success: boolean; message: string; count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const count = response?.count || 0;
      toast.success(`Todas las notificaciones marcadas como leídas (${count})`);
    },
    onError: (error: Error) => {
      toast.error('Error al marcar todas las notificaciones como leídas', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Notificación eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar notificación', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Eliminar notificaciones leídas
  const deleteReadNotificationsMutation = useMutation({
    mutationFn: () => deleteReadNotifications(),
    onSuccess: (response: { success: boolean; message: string; deleted_count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const count = response?.deleted_count || 0;
      toast.success(`${count} notificaciones leídas eliminadas`);
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar notificaciones leídas', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  // Eliminar todas las notificaciones
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: (response: { success: boolean; message: string; deleted_count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const count = response?.deleted_count || 0;
      toast.success(`Todas las notificaciones eliminadas (${count})`);
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar todas las notificaciones', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  return {
    markAsRead: {
      mutate: (id: number) => markAsReadMutation.mutate(id),
      isPending: markAsReadMutation.isPending,
    },
    markAsUnread: {
      mutate: (id: number) => markAsUnreadMutation.mutate(id),
      isPending: markAsUnreadMutation.isPending,
    },
    markMultipleAsRead: {
      mutate: (data: MarkAsReadData) => markMultipleAsReadMutation.mutate(data),
      isPending: markMultipleAsReadMutation.isPending,
    },
    markAllAsRead: {
      mutate: () => markAllAsReadMutation.mutate(),
      isPending: markAllAsReadMutation.isPending,
    },
    deleteNotification: {
      mutate: (id: number) => deleteNotificationMutation.mutate(id),
      isPending: deleteNotificationMutation.isPending,
    },
    deleteReadNotifications: {
      mutate: () => deleteReadNotificationsMutation.mutate(),
      isPending: deleteReadNotificationsMutation.isPending,
    },
    deleteAllNotifications: {
      mutate: () => deleteAllNotificationsMutation.mutate(),
      isPending: deleteAllNotificationsMutation.isPending,
    },
  };
};