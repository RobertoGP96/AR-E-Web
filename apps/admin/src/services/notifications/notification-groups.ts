/**
 * Servicio para gestión de grupos de notificaciones
 */

import { apiClient } from '../../lib/api-client';
import type { Notification, NotificationGroup } from '../../types/models';

/**
 * Obtiene todas las notificaciones de un grupo específico
 */
export const expandNotificationGroup = async (groupId: number): Promise<Notification[]> => {
  return await apiClient.get<Notification[]>(`/api_data/notifications/groups/${groupId}/expand/`);
};

/**
 * Marca un grupo de notificaciones como leído
 */
export const markGroupAsRead = async (groupId: number): Promise<void> => {
  return await apiClient.post(`/api_data/notifications/groups/${groupId}/mark-as-read/`);
};

/**
 * Elimina un grupo de notificaciones
 */
export const deleteNotificationGroup = async (groupId: number): Promise<void> => {
  return await apiClient.delete(`/api_data/notifications/groups/${groupId}/`);
};

/**
 * Obtiene detalles de un grupo específico
 */
export const getNotificationGroup = async (groupId: number): Promise<NotificationGroup> => {
  return await apiClient.get<NotificationGroup>(`/api_data/notifications/groups/${groupId}/`);
};

/**
 * Limpia grupos de notificaciones antiguos
 */
export const cleanupOldGroups = async (days: number = 30): Promise<{ deleted_count: number }> => {
  return await apiClient.post('/api_data/notifications/groups/cleanup/', { days });
};