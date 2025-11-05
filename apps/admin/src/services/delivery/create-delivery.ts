/**
 * Servicio para crear deliveries
 */

import { apiClient } from '../../lib/api-client';
import type { DeliverReceip } from '../../types';
import type { CreateDeliverReceipData } from '../../types/models/delivery';

/**
 * Crea un nuevo delivery
 */
export const createDelivery = async (deliveryData: CreateDeliverReceipData): Promise<DeliverReceip> => {
  return await apiClient.post<DeliverReceip>('/api_data/delivery_receips/', deliveryData);
};