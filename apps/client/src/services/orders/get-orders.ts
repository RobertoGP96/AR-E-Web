/**
 * Servicio para obtener órdenes
 */

import type { Order } from '@/types/order';
import { apiClient } from '@/lib';
import type { OrderFilters } from '../../types/api';


/**
 * Obtiene órdenes de un cliente específico
 */
export const getOrdersByClient = async (clientId: number, filters?: OrderFilters) => {
  const clientFilters = { ...filters, client_id: clientId };
  return await apiClient.getPaginated<Order>('/api_data/order/', clientFilters);
};

/**
 * Obtener una orden por su ID
 */
export const getOrderById = async (orderId: number): Promise<Order> => {
  return await apiClient.get<Order>(`/api_data/order/${orderId}/`);
};
