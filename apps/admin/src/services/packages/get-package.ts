/**
 * Servicio para obtener un paquete individual
 */

import { apiClient } from '@/lib/api-client';
import type { Package } from '@/types';

/**
 * Obtiene un paquete por su ID
 */
export const getPackage = async (id: number): Promise<Package> => {
  return await apiClient.get<Package>(`/api_data/package/${id}/`);
};
