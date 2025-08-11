/**
 * Servicio para eliminar paquetes
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Elimina un paquete por ID
 */
export const deletePackage = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/packages/${id}/`);
};

/**
 * Elimina múltiples paquetes
 */
export const deleteMultiplePackages = async (ids: number[]): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/packages/bulk-delete/', { package_ids: ids });
};
