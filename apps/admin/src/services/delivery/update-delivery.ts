/**
 * Servicio para actualizar deliveries
 */

import { apiClient } from '../../lib/api-client';
import type { DeliverReceip } from '../../types';
import type { UpdateDeliverReceipData } from '../../types/models/delivery';

/**
 * Actualiza un delivery existente
 */
export const updateDelivery = async (id: number, deliveryData: UpdateDeliverReceipData): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/delivery_receips/${id}/`, deliveryData);
};

/**
 * Actualiza el estado de un delivery
 */
export const updateDeliveryStatus = async (id: number, status: string): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/delivery_receips/${id}/`, { status });
};

/**
 * Actualiza la fecha de entrega
 */
export const updateDeliveryDate = async (id: number, deliverDate: string): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/delivery_receips/${id}/`, { deliver_date: deliverDate });
};

/**
 * Actualiza el estado de pago de un delivery
 */
export const updateDeliveryPaymentStatus = async (id: number, paymentStatus: string): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/delivery_receips/${id}/`, { payment_status: paymentStatus });
};

/**
 * Marca un delivery como pagado con la cantidad recibida.
 * El backend determinará automáticamente el payment_status basándose en:
 * - Si payment_amount >= weight_cost => 'Pagado'
 * - Si 0 < payment_amount < weight_cost => 'Parcial'
 * - Si payment_amount == 0 => 'No pagado'
 */
export const markDeliveryAsPaid = async (id: number, amountReceived?: number, paymentDate?: Date): Promise<DeliverReceip> => {
  // Validar que el ID sea válido
  if (!id || id === undefined || id === null) {
    const error = `[markDeliveryAsPaid] ERROR: ID inválido recibido: ${id}`;
    console.error(error);
    throw new Error('ID de entrega inválido. No se puede actualizar el pago.');
  }
  
  // Si se proporciona una cantidad recibida, actualizamos solo ese campo
  // El backend se encargará de ajustar automáticamente el payment_status
  if (amountReceived !== undefined && amountReceived > 0) {
    const url = `/api_data/delivery_receips/${id}/`;
    return await apiClient.patch<DeliverReceip>(url, {
      payment_amount: amountReceived,
      payment_date: paymentDate
    });
  }
  
  // Si no se proporciona cantidad, marcamos como Pagado directamente
  return await updateDeliveryPaymentStatus(id, 'Pagado');
};