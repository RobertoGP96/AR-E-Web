/**
 * Tipos para análisis de compras (ShoppingReceip analysis)
 */

/**
 * Análisis detallado de compras para un rango de fechas
 */
export interface PurchaseAnalysisData {
  totals: {
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    total_real_cost_paid: number;
    total_operational_expenses: number;
    total_products_bought: number;
    avg_purchase_amount: number;
    avg_refund_amount: number;
    total_profit: number;
  };
  by_status: Record<string, number>;
  by_shop: Record<string, ShopPurchaseStats>;
  by_card: Record<string, CardPurchaseStats>;
  by_payment_status: Record<string, {
    count: number;
    total_amount: number;
    total_refunded: number;
    avg_amount: number;
  }>;
  by_account: Record<string, AccountPurchaseStats>;
  monthly_trend: MonthlyPurchaseTrend[];
  refunded_purchases_count: number;
  non_refunded_purchases_count: number;
  refund_rate_percentage: number;
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
 * Estadísticas por tarjeta
 */
export interface CardPurchaseStats {
  count: number;
  total_purchase_amount: number;
  total_refunded: number;
  total_real_cost_paid: number;
  total_operational_expenses: number;
  by_payment_status: Record<string, {
    count: number;
    total_amount: number;
    total_refunded: number;
  }>;
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
  month: string | null;
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
