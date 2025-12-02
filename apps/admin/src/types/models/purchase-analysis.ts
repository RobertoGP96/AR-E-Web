/**
 * Tipos para análisis de compras (ShoppingReceip analysis)
 */

/**
 * Análisis detallado de compras para un rango de fechas
 */
export interface PurchaseAnalysisData {
  count: number;
  total_purchase_amount: number;
  total_refunded: number;
  total_real_cost_paid: number;
  total_operational_expenses: number;
  total_products_bought: number;
  average_purchase_amount: number;
  average_refund_amount: number;
  refunded_purchases_count: number;
  non_refunded_purchases_count: number;
  refund_rate_percentage: number;
  purchases_by_status: Record<string, number>;
  purchases_by_shop: Record<string, ShopPurchaseStats>;
  purchases_by_account: Record<string, AccountPurchaseStats>;
  monthly_trend: MonthlyPurchaseTrend[];
}

/**
 * Estadísticas de compras por tienda
 */
export interface ShopPurchaseStats {
  count: number;
  total_purchase_amount: number;
  total_refunded: number;
  total_real_cost_paid: number;
  total_operational_expenses: number;
  total_products: number;
}

/**
 * Estadísticas de compras por cuenta de compra
 */
export interface AccountPurchaseStats {
  count: number;
  total_purchase_amount: number;
  total_refunded: number;
  total_real_cost_paid: number;
}

/**
 * Tendencia mensual de compras
 */
export interface MonthlyPurchaseTrend {
  month: string;
  count: number;
  total_purchase_amount: number;
  total_refunded: number;
  net_cost: number;
}

/**
 * Resumen rápido de compras
 */
export interface PurchasesSummaryData {
  purchases_count: number;
  total_spent: number;
  total_refunded: number;
  net_spent: number;
  operational_expenses: number;
  products_count: number;
  average_purchase: number;
  refund_rate: number;
}

/**
 * Análisis de productos comprados con métricas de reembolsos
 */
export interface ProductBuysAnalysisData {
  total_product_buys: number;
  total_amount_buyed: number;
  total_cost: number;
  total_refunded_items: number;
  total_refund_amount: number;
  refunded_purchases_count: number;
  non_refunded_purchases_count: number;
  refund_percentage: number;
  top_refunded_products: Record<string, RefundedProductStats>;
}

/**
 * Estadísticas de un producto reembolsado
 */
export interface RefundedProductStats {
  refund_count: number;
  total_refund_amount: number;
}
