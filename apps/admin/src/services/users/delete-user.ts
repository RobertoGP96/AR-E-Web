/**
 * Servicio para eliminar usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Elimina un usuario por ID
 */
export const deleteUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/users/${id}/`);
};

/**
 * Elimina múltiples usuarios
 */
export const deleteMultipleUsers = async (ids: number[]): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/users/bulk-delete/', { user_ids: ids });
};

/**
 * Desactiva un usuario (soft delete)
 */
export const deactivateUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/users/${id}/`, { is_active: false });
};

/**
 * Reactiva un usuario
 */
export const reactivateUser = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/users/${id}/`, { is_active: true });
};
