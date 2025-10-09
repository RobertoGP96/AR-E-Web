/**
 * Servicio para obtener órdenes
 */

import { apiClient } from '../../lib/api-client';
import type { OrderFilters, PaginatedApiResponse } from '../../types/api';
import type { Order } from '../../types';

/**
 * Obtiene lista paginada de órdenes
 */
export const getOrders = async (
  filters?: OrderFilters
): Promise<PaginatedApiResponse<Order>> => {
  return await apiClient.getPaginated<Order>('/api_data/order/', filters);
};

/**
 * Obtiene una orden por ID
 */
export const getOrderById = async (id: number) => {
  return await apiClient.get<Order>(`/api_data/order/${id}/`);
};

/**
 * Obtiene órdenes por estado
 */
export const getOrdersByStatus = async (status: string, filters?: OrderFilters) => {
  const statusFilters = { ...filters, status };
  return await apiClient.getPaginated<Order>('/api_data/order/', statusFilters);
};

/**
 * Obtiene órdenes por estado de pago
 */
export const getOrdersByPaymentStatus = async (payStatus: string, filters?: OrderFilters) => {
  const payFilters = { ...filters, pay_status: payStatus };
  return await apiClient.getPaginated<Order>('/api_data/order/', payFilters);
};

/**
 * Obtiene órdenes de un cliente específico
 */
export const getOrdersByClient = async (clientId: number, filters?: OrderFilters) => {
  const clientFilters = { ...filters, client_id: clientId };
  return await apiClient.getPaginated<Order>('/api_data/order/', clientFilters);
};

/**
 * Obtiene órdenes de un agente específico
 */
export const getOrdersByAgent = async (agentId: number, filters?: OrderFilters) => {
  const agentFilters = { ...filters, sales_manager_id: agentId };
  return await apiClient.getPaginated<Order>('/api_data/order/', agentFilters);
};

/**
 * Búsqueda de órdenes por término
 */
export const searchOrders = async (searchTerm: string, filters?: OrderFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<Order>('/api_data/order/', searchFilters);
};
