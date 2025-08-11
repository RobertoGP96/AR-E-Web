/**
 * Servicio para actualizar productos
 */

import { apiClient } from '../../lib/api-client';
import type { Product, ApiResponse } from '../../types';

export interface UpdateProductData {
  shop_name?: string;
  description?: string;
  amount_requested?: number;
  shop_cost?: number;
  total_cost?: number;
  product_pictures?: string[];
}

/**
 * Actualiza un producto existente
 */
export const updateProduct = async (id: number, productData: UpdateProductData): Promise<ApiResponse<Product>> => {
  const { shop_name, ...data } = productData;
  
  const updateData = shop_name ? { ...data, shop: shop_name } : data;
  
  return await apiClient.patch<Product>(`/products/${id}/`, updateData);
};

/**
 * Actualiza la descripción de un producto
 */
export const updateProductDescription = async (id: number, description: string): Promise<ApiResponse<Product>> => {
  return await apiClient.patch<Product>(`/products/${id}/`, { description });
};

/**
 * Actualiza los costos de un producto
 */
export const updateProductCosts = async (
  id: number, 
  costs: {
    shop_cost?: number;
    total_cost?: number;
    amount_requested?: number;
  }
): Promise<ApiResponse<Product>> => {
  return await apiClient.patch<Product>(`/products/${id}/`, costs);
};

/**
 * Actualiza las imágenes de un producto
 */
export const updateProductImages = async (id: number, imageUrls: string[]): Promise<ApiResponse<Product>> => {
  return await apiClient.patch<Product>(`/products/${id}/`, { product_pictures: imageUrls });
};
