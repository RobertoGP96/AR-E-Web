/**
 * Servicio para actualizar invoices
 */

import { apiClient } from '../../lib/api-client';
import type { UpdateInvoiceData, Invoice } from '../../types';

/**
 * Actualiza un invoice existente
 */
export const updateInvoice = async (id: number, invoiceData: UpdateInvoiceData): Promise<Invoice> => {
  return await apiClient.put<Invoice>(`/api_data/invoice/${id}/`, invoiceData);
};

/**
 * Actualiza parcialmente un invoice
 */
export const partialUpdateInvoice = async (id: number, invoiceData: Partial<UpdateInvoiceData>): Promise<Invoice> => {
  return await apiClient.patch<Invoice>(`/api_data/invoice/${id}/`, invoiceData);
};