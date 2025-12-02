import { apiClient } from '@/lib/api-client';

/**
 * Response types for purchases analysis
 */
export interface PurchaseAnalysisResponse {
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
  purchases_by_shop: Record<string, {
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    total_real_cost_paid: number;
    total_operational_expenses: number;
    total_products: number;
  }>;
  purchases_by_account: Record<string, {
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    total_real_cost_paid: number;
  }>;
  monthly_trend: Array<{
    month: string;
    count: number;
    total_purchase_amount: number;
    total_refunded: number;
    net_cost: number;
  }>;
}

export interface PurchasesSummary {
  purchases_count: number;
  total_spent: number;
  total_refunded: number;
  net_spent: number;
  operational_expenses: number;
  products_count: number;
  average_purchase: number;
  refund_rate: number;
}

export interface ProductBuysAnalysis {
  total_product_buys: number;
  total_amount_buyed: number;
  total_cost: number;
  total_refunded_items: number;
  total_refund_amount: number;
  refunded_purchases_count: number;
  non_refunded_purchases_count: number;
  refund_percentage: number;
  top_refunded_products: Record<string, {
    refund_count: number;
    total_refund_amount: number;
  }>;
}

/**
 * Get detailed purchases analysis for a date range
 */
export async function getPurchasesAnalysis(params: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: PurchaseAnalysisResponse }> {
  try {
    const response = await apiClient.get<{ data: PurchaseAnalysisResponse }>(
      '/api_data/reports/purchases/',
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching purchases analysis:', error);
    throw error;
  }
}

/**
 * Get purchases summary for a date range
 */
export async function getPurchasesSummary(params: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: PurchasesSummary }> {
  try {
    const response = await apiClient.get<{ data: PurchasesSummary }>(
      '/api_data/reports/purchases/summary/',
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching purchases summary:', error);
    throw error;
  }
}

/**
 * Get product buys analysis for a date range
 */
export async function getProductBuysAnalysis(params: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: ProductBuysAnalysis }> {
  try {
    const response = await apiClient.get<{ data: ProductBuysAnalysis }>(
      '/api_data/reports/purchases/products/',
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching product buys analysis:', error);
    throw error;
  }
}
