/**
 * Servicio para acciones de notificaciones (marcar como leída, eliminar, etc.)
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types/api';
import type {
  Notification,
  MarkAsReadData,
  UpdateNotificationData
} from '../../types/models';

/**
 * Marca una notificación específica como leída
 */
export const markAsRead = async (id: number): Promise<Notification> => {
  return await apiClient.post<Notification>(`/api_data/notifications/${id}/mark-as-read/`);
};

/**
 * Marca una notificación específica como no leída
 */
export const markAsUnread = async (id: number): Promise<Notification> => {
  return await apiClient.post<Notification>(`/api_data/notifications/${id}/mark-as-unread/`);
};

/**
 * Marca múltiples notificaciones como leídas
 */
export const markMultipleAsRead = async (data: MarkAsReadData): Promise<ApiResponse<{ marked_count: number }>> => {
  return await apiClient.post<ApiResponse<{ marked_count: number }>>(
    '/api_data/notifications/mark-multiple-as-read/',
    data
  );
};

/**
 * Marca todas las notificaciones como leídas
 */
export const markAllAsRead = async (): Promise<ApiResponse<{ marked_count: number }>> => {
  return await apiClient.post<ApiResponse<{ marked_count: number }>>(
    '/api_data/notifications/mark-all-as-read/'
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
export const deleteReadNotifications = async (): Promise<ApiResponse<{ deleted_count: number }>> => {
  return await apiClient.delete<ApiResponse<{ deleted_count: number }>>(
    '/api_data/notifications/delete-read/'
  );
};

/**
 * Elimina todas las notificaciones del usuario
 */
export const deleteAllNotifications = async (): Promise<ApiResponse<{ deleted_count: number }>> => {
  return await apiClient.delete<ApiResponse<{ deleted_count: number }>>(
    '/api_data/notifications/delete-all/'
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