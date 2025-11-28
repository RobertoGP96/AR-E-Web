/**
 * Servicio para métricas del dashboard
 * 
 * NOTA: Estos endpoints de analytics no están implementados en el backend actual.
 * Los endpoints disponibles son:
 * - /api_data/dashboard/stats/
 * - /api_data/dashboard/orders/
 * - /api_data/dashboard/products/
 * - /api_data/dashboard/sales/
 * - /api_data/dashboard/activity/
 */

// import { apiClient } from '../../lib/api-client';
// import type { DashboardMetrics, ChartData, ApiResponse } from '../../types';

/**
 * Funciones temporales stub hasta que se implementen los endpoints en el backend
 */
export const getDashboardMetrics = async () => {
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

export const getUsersStats = async (_period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  void _period;
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

export const getOrdersStats = async (_period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  void _period;
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

export const getSalesStats = async (_period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  void _period;
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

export const getTopProducts = async (_limit: number = 10) => {
  void _limit;
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

export const getTopAgents = async (_limit: number = 10) => {
  void _limit;
  // TODO: Implementar cuando el backend esté listo
  return Promise.resolve({ data: null });
};

/**
 * Obtiene métricas generales del dashboard
 * Nota: Este endpoint no existe, usar /api_data/dashboard/stats/ del api.ts
 */
// export const getDashboardMetrics = async (): Promise<ApiResponse<DashboardMetrics>> => {
//   return await apiClient.get<DashboardMetrics>('/analytics/dashboard/');
// };

/**
 * Obtiene estadísticas de usuarios
 * Nota: Este endpoint no existe en el backend actual
 */
// export const getUsersStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
//   return await apiClient.get<ChartData>(`/analytics/users/?period=${period}`);
// };

/**
 * Obtiene estadísticas de órdenes
 * Nota: Este endpoint no existe, usar /api_data/dashboard/orders/ del api.ts
 */
// export const getOrdersStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
//   return await apiClient.get<ChartData>(`/analytics/orders/?period=${period}`);
// };

/**
 * Obtiene estadísticas de ventas
 * Nota: Este endpoint no existe, usar /api_data/dashboard/sales/ del api.ts
 */
// export const getSalesStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
//   return await apiClient.get<ChartData>(`/analytics/sales/?period=${period}`);
// };

/**
 * Obtiene estadísticas de productos más vendidos
 * Nota: Este endpoint no existe, usar /api_data/dashboard/products/ del api.ts
 */
// export const getTopProducts = async (limit: number = 10) => {
//   return await apiClient.get<ChartData>(`/analytics/top-products/?limit=${limit}`);
// };

/**
 * Obtiene estadísticas de agentes más productivos
 * Nota: Este endpoint no existe en el backend actual
 */
// export const getTopAgents = async (limit: number = 10) => {
//   return await apiClient.get<ChartData>(`/analytics/top-agents/?limit=${limit}`);
// };
