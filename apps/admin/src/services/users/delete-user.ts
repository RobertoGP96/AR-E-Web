/**
 * Servicio para eliminar usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Elimina un usuario por ID
 */
export const deleteUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/api_data/user/${id}/`);
};

/**
 * Elimina múltiples usuarios
 * Nota: Este endpoint no existe en el backend, comentado hasta implementación
 */
// export const deleteMultipleUsers = async (ids: number[]): Promise<ApiResponse<void>> => {
//   return await apiClient.post<void>('/api_data/user/bulk-delete/', { user_ids: ids });
// };

/**
 * Desactiva un usuario (soft delete)
 */
export const deactivateUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/api_data/user/${id}/`, { is_active: false });
};

/**
 * Reactiva un usuario
 */
export const reactivateUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/api_data/user/${id}/`, { is_active: true });
};
