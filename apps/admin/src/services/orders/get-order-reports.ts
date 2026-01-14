/**
 * Servicio para obtener reportes/agregados de órdenes
 */
import { apiClient } from '@/lib/api-client';
import type { OrderAnalysis } from '@/types/services/order';

export const getOrderReportsAnalysis = async (params?: Record<string, unknown>) => {
  return apiClient.get<{ data: OrderAnalysis }>('/api_data/reports/orders/', { params });
};

export default { getOrderReportsAnalysis };
