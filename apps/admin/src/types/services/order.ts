interface OrderDetail {
  id: number;
  revenue: number;
  total_cost: number;
  total_expenses: number;
  total_profit: number;
  balance: number;
  pay_status: string;
  status: string;
  created_at: string; // or Date if you parse it
}

interface PaymentBreakdownItem {
  count: number;
  total: number;
  percentage: number;
}

interface OrderStatusItem {
  count: number;
  total_revenue: number;
  avg_revenue: number;
  paid_count: number;
  unpaid_count: number;
}

interface MonthlyTrendItem {
  month: string | null;
  total: number;
  paid: number;
  unpaid: number;
  order_count: number;
}

export interface OrderAnalysis {
  // Totals
  total_revenue: number;
  paid_revenue: number;
  unpaid_revenue: number;
  
  // Counts
  total_count: number;
  paid_count: number;
  unpaid_count: number;
  
  // Averages
  average_revenue: number;
  average_paid: number;
  average_unpaid: number;
  
  // Financials
  total_cost: number;
  total_expenses: number;
  total_profit: number;
  total_paid_cost: number;
  total_paid_expenses: number;
  total_paid_profit: number;
  total_unpaid_cost: number;
  total_unpaid_expenses: number;
  total_unpaid_profit: number;

  payments_out_date: {
    total_revenue: number;
    total_payments: number;
  };
  
  // Breakdowns
  payment_breakdown: Record<string, PaymentBreakdownItem>;
  orders_by_status: Record<string, OrderStatusItem>;
  monthly_trend: MonthlyTrendItem[];
  orders: OrderDetail[];
}