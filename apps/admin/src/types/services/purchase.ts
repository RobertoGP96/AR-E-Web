 export interface PurchaseAnalysis {
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
  by_shop: Record<string, {
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    total_real_cost_paid: number;
    total_operational_expenses: number;
    total_products: number;
  }>;
  by_card: Record<string, {
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
  }>;
  by_payment_status: Record<string, {
    count: number;
    total_amount: number;
    total_refunded: number;
    avg_amount: number;
  }>;
  by_account: Record<string, {
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    total_real_cost_paid: number;
  }>;
  monthly_trend: Array<{
    month: string | null;
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    net_cost?: number;
  }>;
  refunded_purchases_count: number;
  non_refunded_purchases_count: number;
  refund_rate_percentage: number;
}