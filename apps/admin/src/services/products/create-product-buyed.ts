import { apiClient } from '../../lib/api-client';
import type { CreateProductBuyedData, ProductBuyed } from '../../types/models/product-buyed';

/**
 * Crea un nuevo producto comprado
 */
export async function createProductBuyed(data: CreateProductBuyedData): Promise<ProductBuyed> {
  return await apiClient.post<ProductBuyed>('/api/product-buyed/', data);
}