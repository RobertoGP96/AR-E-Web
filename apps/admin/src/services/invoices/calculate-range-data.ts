/**
 * Servicio para calcular datos agregados de invoices en un rango de fechas
 */
import { apiClient } from '../../lib/api-client';
import type { InvoiceRangeData } from '@/types/models/invoice';

export const calculateInvoiceRangeData = async (start: string, end: string): Promise<InvoiceRangeData> => {
  const response = await apiClient.get<InvoiceRangeData>(`/api_data/invoice/calculate_range_data/`, { params: { start, end } });
  return response;
};
