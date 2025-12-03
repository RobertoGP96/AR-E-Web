/**
 * Servicio para obtener órdenes
 */

import type { Order, OrderFiltersForMyOrders } from '@/types/order';
import { apiClient } from '@/lib';
import type { BaseFilters } from '../../types/api';

/**
 * Obtiene órdenes de un cliente específico por ID
 */
export const getOrderById = async (orderId: number) => {
  return await apiClient.get<Order>(`/api_data/order/${orderId}/`);
};

/**
 * Obtiene las órdenes del usuario autenticado (mi cuenta).
 * 
 * IMPORTANTE: 
 * - NO pasar client_id - el backend lo determina del token JWT
 * - El endpoint /my-orders/ solo acepta filtros (status, date, etc)
 * - SEGURIDAD: El backend valida que solo veas tus propias órdenes
 * 
 * @param filters - Filtros opcionales (EXCLUYE client_id)
 */
export const getMyOrders = async (filters?: Omit<OrderFiltersForMyOrders, 'client_id'>) => {
  // ✅ SEGURIDAD: Advertir si alguien intenta pasar client_id
  if (filters && 'client_id' in filters) {
    console.warn('⚠️ SEGURIDAD: client_id debe ser determinado por el backend, no por el cliente');
    delete (filters as any).client_id;
  }

  return await apiClient.getPaginated<Order>(
    '/api_data/order/my-orders/', 
    filters as unknown as BaseFilters
  );
};

