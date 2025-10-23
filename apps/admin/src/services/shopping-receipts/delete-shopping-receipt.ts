/**
 * Servicio para eliminar shopping receipts
 */

import { apiClient } from '../../lib/api-client';

/**
 * Elimina un shopping receipt por ID
 */
export const deleteShoppingReceipt = async (id: number): Promise<void> => {
  return await apiClient.delete<void>(`/api_data/shopping_reciep/${id}/`);
};