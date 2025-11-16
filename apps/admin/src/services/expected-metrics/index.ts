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

  /**
   * Calcular valores proyectados basados en datos del formulario
   */
  calculateProjectedValues: (formData: {
    range_delivery_weight: string;
    range_delivery_cost: string;
    range_revenue: string;
    range_profit: string;
    delivery_real_weight: string;
    delivery_real_cost: string;
    others_costs: string;
  }) => {
    const realWeight = parseFloat(formData.delivery_real_weight) || 0;
    const expectedWeight = parseFloat(formData.range_delivery_weight) || 0;
    const expectedRevenue = parseFloat(formData.range_revenue) || 0;
    const realCost = parseFloat(formData.delivery_real_cost) || 0;
    const expectedCost = parseFloat(formData.range_delivery_cost) || 0;
    const others = parseFloat(formData.others_costs) || 0;
    const expectedProfit = parseFloat(formData.range_profit) || 0;

    const costDifference = realCost - expectedCost;
    const weightDifference = realWeight - expectedWeight;
    const projectedRevenue = expectedWeight > 0 ? expectedRevenue * (realWeight / expectedWeight) : expectedRevenue;
    const projectedProfit = projectedRevenue - realCost - others;
    const projectedProfitDifference = projectedProfit - expectedProfit;
    const weightVariancePercentage = expectedWeight > 0 ? (weightDifference / expectedWeight) * 100 : 0;
    const projectedProfitVariancePercentage = expectedProfit > 0 ? (projectedProfitDifference / expectedProfit) * 100 : 0;

    return {
      cost_difference: costDifference,
      weight_difference: weightDifference,
      projected_profit: projectedProfit,
      projected_profit_difference: projectedProfitDifference,
      weight_variance_percentage: weightVariancePercentage,
      projected_profit_variance_percentage: projectedProfitVariancePercentage,
    };
  },

  /**
   * Calcular valores para mostrar en la tabla de métricas
   */
  calculateTableValues: (metric: ExpectedMetrics) => {
    const costVariance = (parseFloat(metric.delivery_real_cost) || 0) - (parseFloat(metric.range_delivery_cost) || 0);
    const weightVariance = (parseFloat(metric.delivery_real_weight) || 0) - (parseFloat(metric.range_delivery_weight) || 0);
    const weightVariancePercentage = parseFloat(metric.range_delivery_weight) > 0 ? (weightVariance / parseFloat(metric.range_delivery_weight)) * 100 : 0;
    const rangeWeight = parseFloat(metric.range_delivery_weight) || 0;
    const deliveryRealWeight = parseFloat(metric.delivery_real_weight) || 0;
    const projectedRevenue = rangeWeight > 0 ? parseFloat(metric.range_revenue) * (deliveryRealWeight / rangeWeight) : parseFloat(metric.range_revenue) || 0;
    const projectedProfit = projectedRevenue - (parseFloat(metric.delivery_real_cost) || 0) - (parseFloat(metric.others_costs) || 0);
    const projectedProfitVariance = parseFloat(metric.range_profit) > 0 ? ((projectedProfit - parseFloat(metric.range_profit)) / parseFloat(metric.range_profit)) * 100 : 0;

    return {
      costVariance,
      weightVariance,
      weightVariancePercentage,
      projectedRevenue,
      projectedProfit,
      projectedProfitVariance,
    };
  },
};
