export interface OrderAnalysis {
  period: {
    start_date: string; // Formato: 'YYYY-MM-DD'
    end_date: string;   // Formato: 'YYYY-MM-DD'
  };
  
  summary: {
    total_revenue: number;
    paid_revenue: number;
    unpaid_revenue: number;
    payment_index: number;
    total_orders: number;
    paid_orders: number;
    unpaid_orders: number;
    avg_order_value: number;
  };
  
  payment_out_date: {
    total_revenue: number;
    total_payments: number;
  };
  
  payment_analysis: {
    [payStatus: string]: {
      order_count: number;
      revenue: number;
      avg_value: number;
      percentage_of_total: number;
    };
  };
  
  status_analysis: {
    [status: string]: {
      order_count: number;
      revenue: number;
      paid_count: number;
      paid_revenue: number;
      unpaid_count: number;
      payment_rate: number;
    };
  };
  
  trends: Array<{
    month: string; // Formato: 'YYYY-MM'
    order_count: number;
    total_revenue: number;
    paid_revenue: number;
    unpaid_revenue: number;
    paid_count: number;
    unpaid_count: number;
    payment_index: number;
    avg_order_value: number;
  }>;
}