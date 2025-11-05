import { apiClient } from '../../lib/api-client';
import type { DeliverReceip, ID } from '../../types';

/**
 * Obtiene un delivery específico por su ID
 */
export async function getDelivery(id: ID): Promise<DeliverReceip> {
  return apiClient.get<DeliverReceip>(`/api_data/delivery_receips/${id}/`);
}
