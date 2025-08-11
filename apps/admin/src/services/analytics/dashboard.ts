/**
 * Servicio para métricas del dashboard
 */

import { apiClient } from '../../lib/api-client';
import type { DashboardMetrics, ChartData, ApiResponse } from '../../types';

/**
 * Obtiene métricas generales del dashboard
 */
export const getDashboardMetrics = async (): Promise<ApiResponse<DashboardMetrics>> => {
  return await apiClient.get<DashboardMetrics>('/analytics/dashboard/');
};

/**
 * Obtiene estadísticas de usuarios
 */
export const getUsersStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return await apiClient.get<ChartData>(`/analytics/users/?period=${period}`);
};

/**
 * Obtiene estadísticas de órdenes
 */
export const getOrdersStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return await apiClient.get<ChartData>(`/analytics/orders/?period=${period}`);
};

/**
 * Obtiene estadísticas de ventas
 */
export const getSalesStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return await apiClient.get<ChartData>(`/analytics/sales/?period=${period}`);
};

/**
 * Obtiene estadísticas de productos más vendidos
 */
export const getTopProducts = async (limit: number = 10) => {
  return await apiClient.get<ChartData>(`/analytics/top-products/?limit=${limit}`);
};

/**
 * Obtiene estadísticas de agentes más productivos
 */
export const getTopAgents = async (limit: number = 10) => {
  return await apiClient.get<ChartData>(`/analytics/top-agents/?limit=${limit}`);
};
