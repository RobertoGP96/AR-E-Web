/**
 * Servicio para obtener notificaciones
 */

import { apiClient } from '../../lib/api-client';
import type { PaginatedApiResponse } from '../../types/api';
import type {
  Notification,
  NotificationFilters,
  UnreadCountResponse,
  GroupedNotificationsResponse
} from '../../types/models';

/**
 * Obtiene lista paginada de notificaciones del usuario actual
 */
export const getNotifications = async (
  filters?: NotificationFilters
): Promise<PaginatedApiResponse<Notification>> => {
  return await apiClient.getPaginated<Notification>('/api_data/notifications/', filters);
};

/**
 * Obtiene una notificación por ID
 */
export const getNotificationById = async (id: number): Promise<Notification> => {
  return await apiClient.get<Notification>(`/api_data/notifications/${id}/`);
};

/**
 * Obtiene solo notificaciones no leídas
 */
export const getUnreadNotifications = async (
  filters?: NotificationFilters
): Promise<PaginatedApiResponse<Notification>> => {
  const unreadFilters = { ...filters, is_read: false };
  return await apiClient.getPaginated<Notification>('/api_data/notifications/', unreadFilters);
};

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  return await apiClient.get<UnreadCountResponse>('/api_data/notifications/unread-count/');
};

/**
 * Obtiene notificaciones agrupadas
 */
export const getGroupedNotifications = async (): Promise<GroupedNotificationsResponse> => {
  return await apiClient.get<GroupedNotificationsResponse>('/api_data/notifications/grouped/');
};

/**
 * Busca notificaciones por término
 */
export const searchNotifications = async (
  searchTerm: string,
  filters?: NotificationFilters
): Promise<PaginatedApiResponse<Notification>> => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<Notification>('/api_data/notifications/', searchFilters);
};

/**
 * Obtiene notificaciones por tipo
 */
export const getNotificationsByType = async (
  notificationType: string,
  filters?: NotificationFilters
): Promise<PaginatedApiResponse<Notification>> => {
  const typeFilters = { ...filters, notification_type: notificationType };
  return await apiClient.getPaginated<Notification>('/api_data/notifications/', typeFilters);
};

/**
 * Obtiene notificaciones por prioridad
 */
export const getNotificationsByPriority = async (
  priority: string,
  filters?: NotificationFilters
): Promise<PaginatedApiResponse<Notification>> => {
  const priorityFilters = { ...filters, priority };
  return await apiClient.getPaginated<Notification>('/api_data/notifications/', priorityFilters);
};