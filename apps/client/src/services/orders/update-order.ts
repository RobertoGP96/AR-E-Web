/**
 * Servicio para actualizar órdenes
 */

import type { Order } from '@/types/order';
import { apiClient } from '@/lib';
import type { ApiResponse } from '@/types/api';


export interface UpdateOrderData {
  observations?: string;
  pay_status?: string;
  status?: string;
  client_email?: string;
}

/**
 * Actualiza una orden existente
 */
export const updateOrder = async (id: number, orderData: UpdateOrderData): Promise<ApiResponse<Order>> => {
  return await apiClient.patch<Order>(`/orders/${id}/`, orderData);
};

/**
 * Actualiza el estado de una orden
 */
export const updateOrderStatus = async (id: number, status: string): Promise<ApiResponse<Order>> => {
  return await apiClient.patch<Order>(`/orders/${id}/`, { status });
};

/**
 * Actualiza el estado de pago de una orden
 */
export const updateOrderPaymentStatus = async (id: number, payStatus: string): Promise<ApiResponse<Order>> => {
  return await apiClient.patch<Order>(`/orders/${id}/`, { pay_status: payStatus });
};

/**
 * Actualiza las observaciones de una orden
 */
export const updateOrderObservations = async (id: number, observations: string): Promise<ApiResponse<Order>> => {
  return await apiClient.patch<Order>(`/orders/${id}/`, { observations });
};

/**
 * Asigna una orden a un agente
 */
export const assignOrderToAgent = async (orderId: number, agentEmail: string): Promise<ApiResponse<Order>> => {
  return await apiClient.patch<Order>(`/orders/${orderId}/`, { sales_manager: agentEmail });
};

/**
 * Marca una orden como pagada
 */
export const markOrderAsPaid = async (id: number): Promise<ApiResponse<Order>> => {
  return await updateOrderPaymentStatus(id, 'paid');
};

/**
 * Marca una orden como completada
 */
export const markOrderAsCompleted = async (id: number): Promise<ApiResponse<Order>> => {
  return await updateOrderStatus(id, 'completed');
};

/**
 * Cancela una orden
 */
export const cancelOrder = async (id: number, reason?: string): Promise<ApiResponse<Order>> => {
  const updateData: UpdateOrderData = { status: 'cancelled' };
  if (reason) {
    updateData.observations = reason;
  }
  return await apiClient.patch<Order>(`/orders/${id}/`, updateData);
};
