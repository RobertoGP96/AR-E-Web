/**
 * Servicio para eliminar órdenes
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Elimina una orden por ID
 */
export const deleteOrder = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/orders/${id}/`);
};

/**
 * Elimina múltiples órdenes
 */
export const deleteMultipleOrders = async (ids: number[]): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/orders/bulk-delete/', { order_ids: ids });
};
