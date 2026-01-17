/**
 * Servicio para obtener deliveries
 */

import { apiClient } from '../../lib/api-client';
import type { BaseFilters, PaginatedApiResponse } from '../../types/api';
import type { DeliverReceip } from '../../types';
import type { DeliveryAnalysisResponse } from '@/types/services/delivery';

/**
 * Obtiene lista paginada de deliveries
 */
export const getDeliveries = async (
  filters?: BaseFilters
): Promise<PaginatedApiResponse<DeliverReceip>> => {
  return await apiClient.getPaginated<DeliverReceip>('/api_data/delivery_receips/', filters);
};

/**
 * Obtiene un delivery por ID
 */
export const getDeliveryById = async (id: number) => {
  return await apiClient.get<DeliverReceip>(`/api_data/delivery_receips/${id}/`);
};

/**
 * Obtiene deliveries por estado
 */
export const getDeliveriesByStatus = async (status: string, filters?: BaseFilters) => {
  const statusFilters = { ...filters, status };
  return await apiClient.getPaginated<DeliverReceip>('/api_data/delivery_receips/', statusFilters);
};

/**
 * Obtiene deliveries de una orden específica
 */
export const getDeliveriesByOrder = async (orderId: number, filters?: BaseFilters) => {
  const orderFilters = { ...filters, order_id: orderId };
  return await apiClient.getPaginated<DeliverReceip>('/api_data/delivery_receips/', orderFilters);
};

/**
 * Búsqueda de deliveries por término
 */
export const searchDeliveries = async (searchTerm: string, filters?: BaseFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<DeliverReceip>('/api_data/delivery_receips/', searchFilters);
};

/**
 * Delivery reports analysis endpoint
 */
export const getDeliveryReportsAnalysis = async (params?: Record<string, unknown>) => {
  return apiClient.get<{ data: DeliveryAnalysisResponse }>('/api_data/reports/deliveries/', { params });
};