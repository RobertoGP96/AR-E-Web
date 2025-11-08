/**
 * Servicio para acciones de notificaciones (marcar como leída, eliminar, etc.)
 */

import { apiClient } from '../../lib/api-client';
import type {
  Notification,
  MarkAsReadData,
  UpdateNotificationData
} from '../../types/models';

/**
 * Marca una notificación específica como leída
 */
export const markAsRead = async (id: number): Promise<Notification> => {
  return await apiClient.post<Notification>(`/api_data/notifications/${id}/mark_as_read/`);
};

/**
 * Marca una notificación específica como no leída
 */
export const markAsUnread = async (id: number): Promise<Notification> => {
  return await apiClient.post<Notification>(`/api_data/notifications/${id}/mark_as_unread/`);
};

/**
 * Marca múltiples notificaciones como leídas
 */
export const markMultipleAsRead = async (data: MarkAsReadData): Promise<{ success: boolean; message: string; count: number }> => {
  return await apiClient.post<{ success: boolean; message: string; count: number }>(
    '/api_data/notifications/mark_all_as_read/',
    data
  );
};

/**
 * Marca todas las notificaciones como leídas
 */
export const markAllAsRead = async (): Promise<{ success: boolean; message: string; count: number }> => {
  return await apiClient.post<{ success: boolean; message: string; count: number }>(
    '/api_data/notifications/mark_all_as_read/',
    {}
  );
};

/**
 * Elimina una notificación específica
 */
export const deleteNotification = async (id: number): Promise<void> => {
  return await apiClient.delete(`/api_data/notifications/${id}/`);
};

/**
 * Elimina todas las notificaciones leídas
 */
export const deleteReadNotifications = async (): Promise<{ success: boolean; message: string; deleted_count: number }> => {
  return await apiClient.delete<{ success: boolean; message: string; deleted_count: number }>(
    '/api_data/notifications/clear_read/'
  );
};

/**
 * Elimina todas las notificaciones del usuario
 */
export const deleteAllNotifications = async (): Promise<{ success: boolean; message: string; deleted_count: number }> => {
  return await apiClient.delete<{ success: boolean; message: string; deleted_count: number }>(
    '/api_data/notifications/clear_all/'
  );
};

/**
 * Actualiza una notificación (general)
 */
export const updateNotification = async (
  id: number,
  data: UpdateNotificationData
): Promise<Notification> => {
  return await apiClient.patch<Notification>(`/api_data/notifications/${id}/`, data);
};