/**
 * Servicio para estadísticas de notificaciones
 */

import { apiClient } from '../../lib/api-client';
import type { NotificationStats } from '../../types/models';

/**
 * Obtiene estadísticas detalladas de notificaciones
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
  return await apiClient.get<NotificationStats>('/api_data/notifications/stats/');
};

/**
 * Obtiene información sobre throttling de notificaciones
 */
export const getThrottlingInfo = async (): Promise<{
  throttle_info: {
    current_count: number;
    limit: number;
    window_start: string;
    window_end: string;
    can_send: boolean;
  };
}> => {
  return await apiClient.get('/api_data/notifications/throttling-info/');
};