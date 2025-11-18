/**
 * Servicio para eliminar invoices
 */

import { apiClient } from '@/lib/api-client';

/**
 * Elimina un invoice por ID
 */
export const deleteInvoice = async (id: number): Promise<void> => {
  return await apiClient.delete(`/api_data/invoice/${id}/`);
};