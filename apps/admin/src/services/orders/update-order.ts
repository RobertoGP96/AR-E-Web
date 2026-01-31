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
  received_value_of_client?: number;
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
 * Marca una orden como pagada con la cantidad recibida.
 * El backend determinará automáticamente el pay_status basándose en:
 * - Si received_value >= total_cost => 'Pagado'
 * - Si 0 < received_value < total_cost => 'Parcial'
 * - Si received_value == 0 => 'No pagado'
 */
export const markOrderAsPaid = async (id: number, amountReceived?: number, paymentDate?: Date): Promise<Order> => {
  // Validar que el ID sea válido
  if (!id || id === undefined || id === null) {
    const error = `[markOrderAsPaid] ERROR: ID inválido recibido: ${id}`;
    console.error(error);
    throw new Error('ID de orden inválido. No se puede actualizar el pago.');
  }
  // Si se proporciona una cantidad recibida, actualizamos solo ese campo
  // El backend se encargará de ajustar automáticamente el pay_status
  if (amountReceived !== undefined && amountReceived > 0) {
    const url = `/api_data/order/${id}/`;
    return await apiClient.patch<Order>(url, {
      received_value_of_client: amountReceived,
      payment_date: paymentDate
    });
  }
  
  // Si no se proporciona cantidad, marcamos como Pagado directamente
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
