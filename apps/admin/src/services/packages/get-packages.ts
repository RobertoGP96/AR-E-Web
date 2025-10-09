/**
 * Servicio para obtener paquetes
 */

import { apiClient } from '../../lib/api-client';
import type { BaseFilters, PaginatedApiResponse } from '../../types/api';
import type { Package } from '../../types';

/**
 * Obtiene lista paginada de paquetes
 */
export const getPackages = async (
  filters?: BaseFilters
): Promise<PaginatedApiResponse<Package>> => {
  return await apiClient.getPaginated<Package>('/api_data/package/', filters);
};

/**
 * Obtiene un paquete por ID
 */
export const getPackageById = async (id: number) => {
  return await apiClient.get<Package>(`/api_data/package/${id}/`);
};

/**
 * Obtiene paquetes por estado
 */
export const getPackagesByStatus = async (status: string, filters?: BaseFilters) => {
  const statusFilters = { ...filters, status };
  return await apiClient.getPaginated<Package>('/api_data/package/', statusFilters);
};

/**
 * Obtiene paquetes de una orden específica
 */
export const getPackagesByOrder = async (orderId: number, filters?: BaseFilters) => {
  const orderFilters = { ...filters, order_id: orderId };
  return await apiClient.getPaginated<Package>('/api_data/package/', orderFilters);
};

/**
 * Búsqueda de paquetes por término
 */
export const searchPackages = async (searchTerm: string, filters?: BaseFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<Package>('/api_data/package/', searchFilters);
};
