/**
 * Servicio para crear categorías
 */

import { apiClient } from '@/lib/api-client';
import type { Category } from '@/types/models/category';

export interface CreateCategoryData {
  name: string;
  shipping_cost_per_pound: number;
  client_shipping_charge: number;
}

/**
 * Crea una nueva categoría
 */
export const createCategory = async (categoryData: CreateCategoryData): Promise<Category> => {
  return await apiClient.post<Category>('/api_data/category/', categoryData);
};