interface AgentBreakdown {
  agent_id: number | null;
  agent_name: string;
  delivery_count: number;
  total_weight: number;
  total_revenue: number;
  total_expenses: number;
  agent_commission: number;
  total_profit: number;
}

interface MonthlyTrendItem {
  month: string | null;
  total: number;
  total_weight: number;
}

interface CategoryBreakdown {
  [key: string]: {
    count: number;
    total_weight: number;
    total_delivery_revenue: number;
    total_delivery_expenses: number;
    total_manager_profit: number;
    total_system_profit: number;
  };
}

export interface DeliveryAnalysisResponse {
  total_delivery_revenue: number;
  total_delivery_expenses: number;
  total_manager_profit: number;
  total_system_profit: number;
  total_weight: number;
  average_weight: number;
  average_delivery_cost: number;
  count: number;
  deliveries_by_status: Record<string, number>;
  deliveries_by_category: CategoryBreakdown;
  monthly_trend: MonthlyTrendItem[];
  agent_breakdown: AgentBreakdown[];
}