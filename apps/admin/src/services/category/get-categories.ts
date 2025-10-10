/**
 * Servicio para obtener categorías
 */

import { apiClient } from '../../lib/api-client';
import type { PaginatedApiResponse } from '../../types/api';
import type { Category } from '../../types/models/category';

/**
 * Obtiene lista paginada de categorías
 */
export const getCategories = async (): Promise<PaginatedApiResponse<Category>> => {
  return await apiClient.getPaginated<Category>('/api_data/category/');
};

/**
 * Obtiene una categoría por ID
 */
export const getCategoryById = async (id: number) => {
  return await apiClient.get<Category>(`/api_data/category/${id}/`);
};

/**
 * Búsqueda de categorías por nombre
 */
export const searchCategories = async (searchTerm: string) => {
  return await apiClient.getPaginated<Category>('/api_data/category/', { search: searchTerm });
};