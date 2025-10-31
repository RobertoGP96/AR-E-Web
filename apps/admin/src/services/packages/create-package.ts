/**
 * Servicio para crear paquetes
 */

import { apiClient } from '@/lib/api-client';
import type { Package } from '../../types';

export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: string;
  arrival_date: string;
}

/**
 * Crea un nuevo paquete
 */
export const createPackage = async (packageData: CreatePackageData): Promise<Package> => {
  return await apiClient.post<Package>('/api_data/package/', packageData);
};
