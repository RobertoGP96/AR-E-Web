/**
 * Servicio para crear invoices
 */

import { apiClient } from '../../lib/api-client';
import type { CreateInvoiceData, Invoice } from '../../types';

/**
 * Crea un nuevo invoice
 */
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  return await apiClient.post<Invoice>('/api_data/invoice/', invoiceData);
};