/**
 * Servicio para crear paquetes
 */

import { apiClient } from '@/lib/api-client';
import type { Package } from '../../types';

export interface CreatePackageData {
  order_id: number;
  description?: string;
  weight?: number;
  dimensions?: string;
  tracking_number?: string;
  status?: string;
}

/**
 * Crea un nuevo paquete
 */
export const createPackage = async (packageData: CreatePackageData): Promise<Package> => {
  const { order_id, ...data } = packageData;
  
  return await apiClient.post<Package>('/api_data/package/', {
    ...data,
    order: order_id
  });
};
