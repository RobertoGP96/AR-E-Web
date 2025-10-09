/**
 * Servicio para eliminar órdenes
 */

import { apiClient } from '../../lib/api-client';

/**
 * Elimina una orden por ID
 */
export const deleteOrder = async (id: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/order/${id}/`);
};

/**
 * Elimina múltiples órdenes
 */
export const deleteMultipleOrders = async (ids: number[]): Promise<void> => {
  return await apiClient.post<void>('/api_data/order/bulk-delete/', { order_ids: ids });
};
