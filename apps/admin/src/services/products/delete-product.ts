/**
 * Servicio para eliminar productos
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Elimina un producto por ID
 */
export const deleteProduct = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/products/${id}/`);
};

/**
 * Elimina múltiples productos
 */
export const deleteMultipleProducts = async (ids: number[]): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/products/bulk-delete/', { product_ids: ids });
};

/**
 * Elimina todos los productos de una orden
 */
export const deleteProductsByOrder = async (orderId: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/orders/${orderId}/products/`);
};
