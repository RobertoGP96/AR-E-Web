/**
 * Servicio para actualizar órdenes
 */

import { apiClient } from '@/lib/api-client';
import type { Order } from '@/types';

export interface UpdateOrderData {
  observations?: string;
  pay_status?: string;
  status?: string;
  client_email?: string;
}

/**
 * Actualiza una orden existente
 */
export const updateOrder = async (id: number, orderData: UpdateOrderData): Promise<Order> => {
  return await apiClient.patch<Order>(`/api_data/order/${id}/`, orderData);
};

/**
 * Actualiza el estado de una orden
 */
export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  return await apiClient.patch<Order>(`/api_data/order/${id}/`, { status });
};

/**
 * Actualiza el estado de pago de una orden
 */
export const updateOrderPaymentStatus = async (id: number, payStatus: string): Promise<Order> => {
  return await apiClient.patch<Order>(`/api_data/order/${id}/`, { pay_status: payStatus });
};

/**
 * Actualiza las observaciones de una orden
 */
export const updateOrderObservations = async (id: number, observations: string): Promise<Order> => {
  return await apiClient.patch<Order>(`/api_data/order/${id}/`, { observations });
};

/**
 * Asigna una orden a un agente
 */
export const assignOrderToAgent = async (orderId: number, agentEmail: string): Promise<Order> => {
  return await apiClient.patch<Order>(`/api_data/order/${orderId}/`, { sales_manager: agentEmail });
};

/**
 * Marca una orden como pagada
 */
export const markOrderAsPaid = async (id: number): Promise<Order> => {
  // El backend y los tipos usan etiquetas en español (ej. 'Pagado')
  return await updateOrderPaymentStatus(id, 'Pagado');
};

/**
 * Marca una orden como completada
 */
export const markOrderAsCompleted = async (id: number): Promise<Order> => {
  return await updateOrderStatus(id, 'completed');
};

/**
 * Cancela una orden
 */
export const cancelOrder = async (id: number, reason?: string): Promise<Order> => {
  const updateData: UpdateOrderData = { status: 'cancelled' };
  if (reason) {
    updateData.observations = reason;
  }
  return await apiClient.patch<Order>(`/api_data/order/${id}/`, updateData);
};
