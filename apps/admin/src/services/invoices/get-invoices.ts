/**
 * Servicio para obtener invoices
 */

import { apiClient } from '../../lib/api-client';
import type {
  Invoice,
  InvoiceResponse,
  InvoiceFilters
} from '../../types';

/**
 * Obtiene lista paginada de invoices
 */
export const getInvoices = async (
  filters?: InvoiceFilters
): Promise<InvoiceResponse> => {
  const response = await apiClient.getPaginated<Invoice>('/api_data/invoice/', filters);
  return response;
};

/**
 * Obtiene un invoice por ID
 */
export const getInvoiceById = async (id: number): Promise<Invoice> => {
  return await apiClient.get<Invoice>(`/api_data/invoice/${id}/`);
};

/**
 * Obtiene tags de un invoice específico
 */
export const getInvoiceTags = async (invoiceId: number) => {
  return await apiClient.get(`/api_data/invoice/${invoiceId}/tags/`);
};