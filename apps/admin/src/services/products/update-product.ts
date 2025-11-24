/**
 * Servicio para actualizar productos
 */

import { apiClient } from '../../lib/api-client';
import type { Product } from '../../types';

export interface UpdateProductData {
  shop_name?: string;
  description?: string;
  amount_requested?: number;
  shop_cost?: number;
  total_cost?: number;
  product_pictures?: string;
  status?: string;
}

/**
 * Actualiza un producto existente
 */
export const updateProduct = async (id: number, productData: UpdateProductData): Promise<Product> => {
  const { shop_name, ...data } = productData;
  
  const updateData = shop_name ? { ...data, shop: shop_name } : data;
  
  return await apiClient.patch<Product>(`/api_data/product/${id}/`, updateData);
};

/**
 * Actualiza la descripción de un producto
 */
export const updateProductDescription = async (id: number, description: string): Promise<Product> => {
  return await apiClient.patch<Product>(`/api_data/product/${id}/`, { description });
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
): Promise<Product> => {
  return await apiClient.patch<Product>(`/api_data/product/${id}/`, costs);
};

/**
 * Actualiza las imágenes de un producto
 */
export const updateProductImages = async (id: number, imageUrl: string): Promise<Product> => {
  return await apiClient.patch<Product>(`/api_data/product/${id}/`, { product_pictures: imageUrl });
};

/**
 * Actualiza el status de un producto
 */
export const updateProductStatus = async (id: string, status: string): Promise<Product> => {
  return await apiClient.patch<Product>(`/api_data/product/${id}/`, { status });
};
