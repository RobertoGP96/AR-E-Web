/**
 * Servicio para actualizar categorías
 */

import { apiClient } from '../../lib/api-client';
import type { Category } from '../../types/models/category';

export interface UpdateCategoryData {
  name?: string;
  shipping_cost_per_pound?: number;
}

/**
 * Actualiza una categoría existente
 */
export const updateCategory = async (id: number, categoryData: UpdateCategoryData): Promise<Category> => {
  return await apiClient.patch<Category>(`/api_data/category/${id}/`, categoryData);
};

/**
 * Actualiza el costo de envío de una categoría
 */
export const updateCategoryShippingCost = async (id: number, shipping_cost_per_pound: number): Promise<Category> => {
  return await apiClient.patch<Category>(`/api_data/category/${id}/`, { shipping_cost_per_pound });
};