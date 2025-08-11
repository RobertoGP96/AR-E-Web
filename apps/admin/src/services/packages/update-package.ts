/**
 * Servicio para actualizar paquetes
 */

import { apiClient } from '../../lib/api-client';
import type { Package, ApiResponse } from '../../types';

export interface UpdatePackageData {
  description?: string;
  weight?: number;
  dimensions?: string;
  tracking_number?: string;
  status?: string;
}

/**
 * Actualiza un paquete existente
 */
export const updatePackage = async (id: number, packageData: UpdatePackageData): Promise<ApiResponse<Package>> => {
  return await apiClient.patch<Package>(`/packages/${id}/`, packageData);
};

/**
 * Actualiza el estado de un paquete
 */
export const updatePackageStatus = async (id: number, status: string): Promise<ApiResponse<Package>> => {
  return await apiClient.patch<Package>(`/packages/${id}/`, { status });
};

/**
 * Actualiza el número de seguimiento
 */
export const updatePackageTracking = async (id: number, trackingNumber: string): Promise<ApiResponse<Package>> => {
  return await apiClient.patch<Package>(`/packages/${id}/`, { tracking_number: trackingNumber });
};
