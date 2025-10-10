/**
 * Servicio para eliminar categorías
 */

import { apiClient } from '../../lib/api-client';

/**
 * Elimina una categoría por ID
 */
export const deleteCategory = async (id: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/category/${id}/`);
};