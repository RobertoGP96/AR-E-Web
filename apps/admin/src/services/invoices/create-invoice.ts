/**
 * Servicio para crear invoices
 */

import type { CreateInvoiceData, Invoice } from '@/types/models';
import { apiClient } from '@/lib/api-client';

/**
 * Crea un nuevo invoice
 */
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  return await apiClient.post<Invoice>('/api_data/invoice/', invoiceData);
};