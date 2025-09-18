/**
 * Servicio para crear órdenes
 */

import type { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib';
import type { Order } from '@/types/order';

export interface CreateOrderData {
  client_email: string;
  observations?: string;
  pay_status?: string;
  status?: string;
}

/**
 * Crea una nueva orden
 */
export const createOrder = async (orderData: CreateOrderData): Promise<ApiResponse<Order>> => {
  return await apiClient.post<Order>('/orders/', orderData);
};

/**
 * Crea orden rápida para un cliente existente
 */
export const createQuickOrder = async (clientEmail: string): Promise<ApiResponse<Order>> => {
  return await createOrder({
    client_email: clientEmail,
    status: 'pending',
    pay_status: 'pending'
  });
};

/**
 * Crea una orden con productos
 */
export const createOrderWithProducts = async (
  orderData: CreateOrderData,
  products: Array<{
    shop_name: string;
    description: string;
    amount_requested: number;
    shop_cost: number;
    total_cost: number;
  }>
): Promise<ApiResponse<Order>> => {
  const order = await createOrder(orderData);
  
  if (order.success && order.data) {
    // Crear productos para la orden
    for (const productData of products) {
      await apiClient.post('/products/', {
        ...productData,
        order: order.data.id
      });
    }
    
    // Recargar la orden con productos
    return await apiClient.get<Order>(`/orders/${order.data.id}/`);
  }
  
  return order;
};
