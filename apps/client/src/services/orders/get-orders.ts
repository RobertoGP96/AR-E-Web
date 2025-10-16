/**
 * Servicio para obtener órdenes
 */

import type { Order } from '@/types/order';
import { apiClient } from '@/lib';
import type { OrderFilters, BaseFilters } from '../../types/api';



/**
 * Obtiene las órdenes del usuario autenticado (mi cuenta).
 * Usa el endpoint protegido `my-orders` en el backend.
 */
export const getMyOrders = async (filters?: OrderFilters) => {
  return await apiClient.getPaginated<Order>('/api_data/order/my-orders/', filters as unknown as BaseFilters);
};

