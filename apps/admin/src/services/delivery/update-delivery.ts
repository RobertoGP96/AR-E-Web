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
  return await apiClient.patch<DeliverReceip>(`/api_data/deliver_reciep/${id}/`, deliveryData);
};

/**
 * Actualiza el estado de un delivery
 */
export const updateDeliveryStatus = async (id: number, status: string): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/deliver_reciep/${id}/`, { status });
};

/**
 * Actualiza la fecha de entrega
 */
export const updateDeliveryDate = async (id: number, deliverDate: string): Promise<DeliverReceip> => {
  return await apiClient.patch<DeliverReceip>(`/api_data/deliver_reciep/${id}/`, { deliver_date: deliverDate });
};