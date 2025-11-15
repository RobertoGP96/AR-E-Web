/**
 * Expected Metrics Service
 * Servicio para gestionar las métricas esperadas vs reales
 */

import { apiClient } from '../../lib/api-client';
import type { 
  ApiResponse, 
  PaginatedApiResponse,
  BaseFilters
} from '../../types/api';
import type {
  ExpectedMetrics,
  CreateExpectedMetricsData,
  UpdateExpectedMetricsData,
  ExpectedMetricsFilters,
  ExpectedMetricsSummary,
  CalculateActualsResponse
} from '../../types';

const BASE_PATH = '/api_data/expected_metrics';

export const expectedMetricsService = {
  /**
   * Obtener lista de métricas esperadas con paginación
   */
  getMetrics: async (filters?: ExpectedMetricsFilters): Promise<PaginatedApiResponse<ExpectedMetrics>> => {
    return apiClient.getPaginated(BASE_PATH + '/', filters as BaseFilters);
  },

  /**
   * Obtener una métrica por ID
   */
  getMetricById: async (id: number): Promise<ApiResponse<ExpectedMetrics>> => {
    return apiClient.get(`${BASE_PATH}/${id}/`);
  },

  /**
   * Crear una nueva métrica esperada
   */
  createMetric: async (data: CreateExpectedMetricsData): Promise<ApiResponse<ExpectedMetrics>> => {
    return apiClient.post(BASE_PATH + '/', data);
  },

  /**
   * Actualizar una métrica existente
   */
  updateMetric: async (id: number, data: UpdateExpectedMetricsData): Promise<ApiResponse<ExpectedMetrics>> => {
    return apiClient.patch(`${BASE_PATH}/${id}/`, data);
  },

  /**
   * Eliminar una métrica
   */
  deleteMetric: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/${id}/`);
  },

  /**
   * Calcular valores reales desde los datos del sistema
   */
  calculateActuals: async (id: number): Promise<ApiResponse<CalculateActualsResponse>> => {
    return apiClient.post(`${BASE_PATH}/${id}/calculate-actuals/`, {});
  },

  /**
   * Obtener resumen de todas las métricas
   */
  getSummary: async (): Promise<ApiResponse<ExpectedMetricsSummary>> => {
    return apiClient.get(`${BASE_PATH}/summary/`);
  },

  /**
   * Calcular datos reales para un rango de fechas
   */
  calculateRangeData: async (start: string, end: string): Promise<ApiResponse<{
    start_date: string;
    end_date: string;
    total_weight: number;
    total_cost: number;
    total_profit: number;
    total_revenue: number;
    orders_count: number;
    deliveries_count: number;
    products_bought_count: number;
  }>> => {
    return apiClient.get(`${BASE_PATH}/calculate-range-data/`, {
      params: { start, end }
    });
  },
};
