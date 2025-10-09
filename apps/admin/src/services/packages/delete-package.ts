/**
 * Servicio para eliminar paquetes
 */

import { apiClient } from '@/lib/api-client';

/**
 * Elimina un paquete por ID
 */
export const deletePackage = async (id: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/package/${id}/`);
};

/**
 * Elimina múltiples paquetes
 */
export const deleteMultiplePackages = async (ids: number[]): Promise<void> => {
  return await apiClient.post<void>('/api_data/package/bulk-delete/', { package_ids: ids });
};
