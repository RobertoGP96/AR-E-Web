/**
 * Expected Metrics Types
 * Tipos para las métricas esperadas vs reales de costos y ganancias
 */

import type { ID, DateTime } from './base';

/**
 * Representa una métrica esperada vs real para un rango de fechas
 */
export interface ExpectedMetrics {
  id: ID;
  start_date: string; // Formato: YYYY-MM-DD
  end_date: string; // Formato: YYYY-MM-DD
  range_delivery_weight: string; // Decimal como string (antes expected_cost)
  range_delivery_cost: string; // Decimal como string (antes expected_cost)
  range_revenue: string; // Decimal como string (nuevo)
  range_profit: string; // Decimal como string (antes expected_profit)
  delivery_real_cost: string; // Decimal como string (antes actual_cost)
  delivery_real_weight: string; // Decimal como string (antes actual_cost)
  others_costs: string; // Decimal como string (nuevo)
  cost_difference: string; // Decimal como string (calculado, antes cost_variance)
  real_profit: string; // Decimal como string (calculado)
  profit_difference: string; // Decimal como string (calculado, antes profit_variance)
  profit_variance_percentage: string; // Decimal como string (calculado)
  notes?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

/**
 * Datos para crear una nueva métrica esperada
 */
export interface CreateExpectedMetricsData {
  start_date: string; // Formato: YYYY-MM-DD
  end_date: string; // Formato: YYYY-MM-DD
  range_delivery_weight: number | undefined;
  range_delivery_cost: number | undefined;
  range_revenue: number | undefined;
  range_profit: number | undefined;
  delivery_real_weight?: number | undefined;
  delivery_real_cost?: number | undefined;
  others_costs?: number | undefined;
  notes?: string;
}

/**
 * Datos para actualizar una métrica esperada
 */
export interface UpdateExpectedMetricsData {
  start_date?: string;
  end_date?: string;
  range_delivery_weight?: number | string;
  range_delivery_cost?: number | string;
  delivery_real_weight?: number | string;
  range_revenue?: number | string;
  range_profit?: number | string;
  delivery_real_cost?: number | string;
  others_costs?: number | string;
  notes?: string;
}

/**
 * Filtros para buscar métricas esperadas
 */
export interface ExpectedMetricsFilters {
  start_date?: string;
  end_date?: string;
  search?: string; // Búsqueda en notes
  ordering?: string; // Campo para ordenar
}

/**
 * Resumen de métricas esperadas
 */
export interface ExpectedMetricsSummary {
  total_range_delivery_weight: number;
  total_range_revenue: number;
  total_range_profit: number;
  total_delivery_real_cost: number;
  total_others_costs: number;
  total_cost_variance: number;
  total_profit_variance: number;
  metrics_count: number;
}

/**
 * Respuesta al calcular valores reales
 */
export interface CalculateActualsResponse {
  message: string;
  data: ExpectedMetrics;
  calculations: {
    orders_count: number;
    products_bought_count: number;
  };
}

/**
 * Versión ligera para listados
 */
export interface ExpectedMetricsListItem {
  id: ID;
  start_date: string;
  end_date: string;
  range_delivery_weight: string;
  range_revenue: string;
  range_profit: string;
  delivery_real_cost: string;
  others_costs: string;
  cost_difference: string;
  profit_difference: string;
  created_at: DateTime;
}
