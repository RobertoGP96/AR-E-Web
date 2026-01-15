import { apiClient } from '@/lib/api-client';
import type { PurchaseAnalysis } from '@/types/services/purchase';


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
}): Promise<{ data: PurchaseAnalysis }> {
  try {
    const response = await apiClient.get<{ data: PurchaseAnalysis }>(
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
