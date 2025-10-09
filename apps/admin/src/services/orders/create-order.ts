/**
 * Servicio para crear órdenes
 */

import { apiClient } from '../../lib/api-client';
import type { Order } from '../../types';

export interface CreateOrderData {
  client_email: string;
  observations?: string;
  pay_status?: string;
  status?: string;
}

/**
 * Crea una nueva orden
 */
export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  return await apiClient.post<Order>('/api_data/order/', orderData);
};

/**
 * Crea orden rápida para un cliente existente
 */
export const createQuickOrder = async (clientEmail: string): Promise<Order> => {
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
): Promise<Order> => {
  const order = await createOrder(orderData);
  
  if (order && order.id) {
    // Crear productos para la orden
    for (const productData of products) {
      await apiClient.post('/api_data/product/', {
        ...productData,
        order: order.id
      });
    }
    
    // Recargar la orden con productos
    return await apiClient.get<Order>(`/api_data/order/${order.id}/`);
  }
  
  return order;
};
