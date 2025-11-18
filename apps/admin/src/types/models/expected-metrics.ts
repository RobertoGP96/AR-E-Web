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
  registered_weight: string; // Decimal como string (peso esperado dentro del periodo)
  registered_cost: string; // Decimal como string (costo esperado dentro del periodo)
  registered_revenue: string; // Decimal como string (ingresos esperados)
  registered_profit: string; // Decimal como string (ganancia esperada)
  invoice_cost: string; // Decimal como string (costo real según facturas)
  invoice_weight: string; // Decimal como string (peso real según facturas)
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
  start_date: string | undefined; // Formato: YYYY-MM-DD
  end_date: string | undefined; // Formato: YYYY-MM-DD
  registered_weight?: number | undefined;
  registered_cost?: number | undefined;
  registered_revenue?: number | undefined;
  registered_profit?: number | undefined;
  invoice_weight?: number | undefined;
  invoice_cost?: number | undefined;
  others_costs?: number | undefined;
  notes?: string;
}

/**
 * Datos para actualizar una métrica esperada
 */
export interface UpdateExpectedMetricsData {
  start_date?: string;
  end_date?: string;
  registered_weight?: number | string;
  registered_cost?: number | string;
  invoice_weight?: number | string;
  registered_revenue?: number | string;
  registered_profit?: number | string;
  invoice_cost?: number | string;
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
  total_registered_weight: number;
  total_registered_cost: number;
  total_registered_revenue: number;
  total_registered_profit: number;
  total_invoice_cost: number;
  total_invoice_weight: number;
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
  registered_weight: string;
  registered_revenue: string;
  registered_profit: string;
  invoice_cost: string;
  others_costs: string;
  cost_difference: string;
  profit_difference: string;
  created_at: DateTime;
}
