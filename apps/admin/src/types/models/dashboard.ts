/**
 * Tipos para estadísticas y métricas del dashboard
 */

// Estadísticas del dashboard
export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_products: number;
  total_users: number;
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  monthly_revenue: number;
  weekly_revenue: number;
}
