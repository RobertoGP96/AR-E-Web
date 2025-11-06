/**
 * Servicio para actualizar paquetes
 */

import { apiClient } from '../../lib/api-client';
import type { Package } from '../../types';

export interface UpdatePackageData {
  agency_name?: string;
  number_of_tracking?: string;
  arrival_date?: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  tracking_number?: string;
  status_of_processing?: string;
}

/**
 * Actualiza un paquete existente
 */
export const updatePackage = async (id: number, packageData: UpdatePackageData): Promise<Package> => {
  return await apiClient.patch<Package>(`/api_data/package/${id}/`, packageData);
};

/**
 * Actualiza el estado de un paquete
 */
export const updatePackageStatus = async (id: number, status: string): Promise<Package> => {
  return await apiClient.patch<Package>(`/api_data/package/${id}/`, { status_of_processing: status });
};

/**
 * Actualiza el número de seguimiento
 */
export const updatePackageTracking = async (id: number, trackingNumber: string): Promise<Package> => {
  return await apiClient.patch<Package>(`/api_data/package/${id}/`, { tracking_number: trackingNumber });
};
