/**
 * Servicio para crear productos
 */

import { apiClient } from '../../lib/api-client';
import type { Product, ApiResponse } from '../../types';

export interface CreateProductData {
  shop_name: string;
  order_id: number;
  description: string;
  amount_requested: number;
  shop_cost: number;
  total_cost: number;
  product_pictures?: string[];
}

/**
 * Crea un nuevo producto
 */
export const createProduct = async (productData: CreateProductData): Promise<ApiResponse<Product>> => {
  const { shop_name, order_id, ...data } = productData;
  
  return await apiClient.post<Product>('/products/', {
    ...data,
    shop: shop_name,
    order: order_id
  });
};

/**
 * Crea múltiples productos para una orden
 */
export const createMultipleProducts = async (
  orderId: number,
  products: Omit<CreateProductData, 'order_id'>[]
): Promise<ApiResponse<Product[]>> => {
  const createdProducts: Product[] = [];
  
  for (const productData of products) {
    const response = await createProduct({ ...productData, order_id: orderId });
    if (response.success && response.data) {
      createdProducts.push(response.data);
    }
  }
  
  return {
    success: true,
    data: createdProducts
  };
};
