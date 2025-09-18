/**
 * Servicio para obtener órdenes
 */

import type { Order } from '@/types/order';
import { apiClient } from '@/lib/api-client.ts';
import type { OrderFilters, PaginatedApiResponse } from '../../types/api';

/**
 * Obtiene lista paginada de órdenes
 */
export const getOrders = async (
  filters?: OrderFilters
): Promise<PaginatedApiResponse<Order>> => {
  return await apiClient.getPaginated<Order>('/orders/', filters as Record<string, unknown>);
};

/**
 * Obtiene una orden por ID
 */
export const getOrderById = async (id: number) => {
  return await apiClient.get<Order>(`/orders/${id}/`);
};

/**
 * Obtiene órdenes por estado
 */
export const getOrdersByStatus = async (status: string, filters?: OrderFilters) => {
  const statusFilters = { ...filters, status };
  return await apiClient.getPaginated<Order>('/orders/', statusFilters);
};

/**
 * Obtiene órdenes por estado de pago
 */
export const getOrdersByPaymentStatus = async (payStatus: string, filters?: OrderFilters) => {
  const payFilters = { ...filters, pay_status: payStatus };
  return await apiClient.getPaginated<Order>('/orders/', payFilters);
};

/**
 * Obtiene órdenes de un cliente específico
 */
export const getOrdersByClient = async (clientId: number, filters?: OrderFilters) => {
  const clientFilters = { ...filters, client_id: clientId };
  return await apiClient.getPaginated<Order>('/orders/', clientFilters);
};

/**
 * Obtiene órdenes de un agente específico
 */
export const getOrdersByAgent = async (agentId: number, filters?: OrderFilters) => {
  const agentFilters = { ...filters, sales_manager_id: agentId };
  return await apiClient.getPaginated<Order>('/orders/', agentFilters);
};

/**
 * Búsqueda de órdenes por término
 */
export const searchOrders = async (searchTerm: string, filters?: OrderFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<Order>('/orders/', searchFilters);
};
