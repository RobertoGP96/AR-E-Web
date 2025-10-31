/**
 * Servicio para eliminar deliveries
 */

import { apiClient } from '../../lib/api-client';

/**
 * Elimina un delivery por ID
 */
export const deleteDelivery = async (id: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/deliver_reciep/${id}/`);
};

/**
 * Elimina múltiples deliveries
 */
export const deleteMultipleDeliveries = async (ids: number[]): Promise<void> => {
  return await apiClient.post<void>('/api_data/deliver_reciep/bulk-delete/', { delivery_ids: ids });
};