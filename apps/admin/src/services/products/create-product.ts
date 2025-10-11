/**
 * Servicio para crear productos
 */

import { apiClient } from '../../lib/api-client';
import type { Product } from '../../types';

export interface CreateProductData {
  shop_name: string;
  order_id: number;
  description: string;
  amount_requested: number;
  shop_cost: number;
  total_cost: number;
  category?: string | null;
  shop_taxes?: number;
  product_pictures?: string[];
}

/**
 * Crea un nuevo producto
 */
export const createProduct = async (productData: CreateProductData): Promise<Product> => {
  const { shop_name, order_id, ...data } = productData;
  
  return await apiClient.post<Product>('/api_data/product/', {
    ...data,
    // backend expects shop as slug (name) and order as id
    shop: shop_name,
    order: order_id,
    // ensure category field is null if not provided
    category: data.category ?? null,
    // map shop_taxes if provided
    shop_taxes: data.shop_taxes ?? data.shop_taxes,
  });
};

/**
 * Crea múltiples productos para una orden
 */
export const createMultipleProducts = async (
  orderId: number,
  products: Omit<CreateProductData, 'order_id'>[]
): Promise<Product[]> => {
  const createdProducts: Product[] = [];
  
  for (const productData of products) {
    const response = await createProduct({ ...productData, order_id: orderId });
    if (response) {
      createdProducts.push(response);
    }
  }
  
  return createdProducts;
};
