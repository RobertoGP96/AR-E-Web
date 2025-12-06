/**
 * Expected Metrics Types
 * Tipos para las métricas esperadas vs reales de costos y ganancias
 */

import type { ID, DateTime } from "./base";

/**
 * Representa una métrica esperada vs real para un rango de fechas
 */
export interface Balance {
  id: ID;
  start_date: string; // Formato: YYYY-MM-DD
  end_date: string; // Formato: YYYY-MM-DD

  system_weight: number; // Decimal como string (peso esperado dentro del periodo)
  registered_weight: number; // Decimal como string (peso esperado dentro del periodo)

  revenues: number; // Decimal como string (costo esperado dentro del periodo)
  buys_cost: number; // Decimal como string (costo real según facturas)
  costs: number; // Decimal como string (peso real según facturas)
  expenses: number; // Decimal como string (nuevo)
  notes?: string;

  weight_difference: number; // Decimal como string (calculado, antes cost_variance)
  total_cost: number; // Decimal como string (calculado)
  real_profit: number; // Decimal como string (calculado, antes profit_variance)

  created_at: DateTime;
  updated_at: DateTime;
}

/**
 * Datos para crear una nueva métrica esperada
 */
export interface CreateBalanceData {
  start_date: string | undefined; // Formato: YYYY-MM-DD
  end_date: string | undefined; // Formato: YYYY-MM-DD
  system_weight: number; // Decimal como string (peso esperado dentro del periodo)
  registered_weight: number; // Decimal como string (peso esperado dentro del periodo)

  revenues: number; // Decimal como string (costo esperado dentro del periodo)
  buys_cost: number; // Decimal como string (costo real según facturas)
  costs: number; // Decimal como string (peso real según facturas)
  expenses: number; // Decimal como string (nuevo)
  notes?: string;
}

/**
 * Datos para actualizar una métrica esperada
 */
export interface UpdateBalanceData {
  start_date?: string;
  end_date?: string;
  system_weight: number; // Decimal como string (peso esperado dentro del periodo)
  registered_weight: number; // Decimal como string (peso esperado dentro del periodo)

  revenues: number; // Decimal como string (costo esperado dentro del periodo)
  buys_cost: number; // Decimal como string (costo real según facturas)
  costs: number; // Decimal como string (peso real según facturas)
  expenses: number; // Decimal como string (nuevo)
  notes?: string;
}

/**
 * Filtros para buscar métricas esperadas
 */
export interface BalanceFilters {
  start_date?: string;
  end_date?: string;
  search?: string; // Búsqueda en notes
  ordering?: string; // Campo para ordenar
}

/**
 * Resumen de métricas esperadas
 */
export interface BalanceSummary {
  total_system_weight: number;
  total_registered_weight: number;
  total_registered_revenue: number;
  total_registered_profit: number;
  total_invoice_cost: number;
  total_invoice_weight: number;
  total_revenues: number;
  total_expenses: number;
  total_cost: number;
  total_profit: number;
  balance_count: number;
}
