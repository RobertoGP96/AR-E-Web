/**
 * Servicio para gestión de preferencias de notificaciones
 */

import { apiClient } from '../../lib/api-client';
import type {
  NotificationPreference,
  UpdateNotificationPreferenceData
} from '../../types/models';

/**
 * Obtiene las preferencias de notificación del usuario actual
 */
export const getNotificationPreferences = async (): Promise<NotificationPreference> => {
  return await apiClient.get<NotificationPreference>('/api_data/notification-preferences/');
};

/**
 * Actualiza las preferencias de notificación
 */
export const updateNotificationPreferences = async (
  data: UpdateNotificationPreferenceData
): Promise<NotificationPreference> => {
  return await apiClient.patch<NotificationPreference>('/api_data/notification-preferences/', data);
};

/**
 * Crea preferencias de notificación por defecto para un usuario
 */
export const createDefaultPreferences = async (): Promise<NotificationPreference> => {
  return await apiClient.post<NotificationPreference>('/api_data/notification-preferences/create-default/');
};