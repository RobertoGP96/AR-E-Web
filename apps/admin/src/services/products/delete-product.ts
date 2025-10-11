/**
 * Servicio para eliminar productos
 */

import { apiClient } from '../../lib/api-client';

/**
 * Elimina un producto por ID
 * Acepta id como number o string para compatibilidad con distintos modelos
 */
export const deleteProduct = async (id: string | number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/product/${id}/`);
};

/**
 * Elimina múltiples productos
 */
export const deleteMultipleProducts = async (ids: number[]): Promise<void> => {
  return await apiClient.post<void>('/api_data/product/bulk-delete/', { product_ids: ids });
};

/**
 * Elimina todos los productos de una orden
 */
export const deleteProductsByOrder = async (orderId: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/order/${orderId}/products/`);
};
