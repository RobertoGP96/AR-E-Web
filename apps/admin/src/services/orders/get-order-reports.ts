/**
 * Servicio para obtener reportes/agregados de órdenes
 */
import { apiClient } from '../../lib/api-client';
import type { OrderAnalysisResponse } from '../../types/models/order';

export const getOrderReportsAnalysis = async (params?: Record<string, unknown>) => {
  return apiClient.get<{ data: OrderAnalysisResponse }>('/api_data/reports/orders/', { params });
};

export default { getOrderReportsAnalysis };
